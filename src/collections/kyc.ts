import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export interface KYC {
  id: string;
  userId: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'requires_changes';
  documents: {
    idCard?: {
      url: string;
      uploadedAt: Date;
      verified: boolean;
    };
    passport?: {
      url: string;
      uploadedAt: Date;
      verified: boolean;
    };
    utilityBill?: {
      url: string;
      uploadedAt: Date;
      verified: boolean;
    };
    selfie?: {
      url: string;
      uploadedAt: Date;
      verified: boolean;
    };
  };
  personalInfo: {
    fullName: string;
    dateOfBirth: Date;
    address: string;
    phoneNumber: string;
    email: string;
    idNumber?: string; // ID number for identification
    idType?: 'national_id' | 'drivers_license' | 'passport' | 'voters_card'; // Type of ID
    nationality?: string; // User's nationality
  };
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  notes?: string;
  verifiedAt?: Date; // When KYC was verified
  verifiedBy?: string; // Who verified the KYC
  createdAt: Date;
  updatedAt: Date;
}

export class KYCCollection {
  private collectionName = 'kyc';

  // Create a new KYC application
  async create(kycData: Omit<KYC, 'id' | 'createdAt' | 'updatedAt'>): Promise<KYC> {
    const kycRef = doc(collection(db, this.collectionName));
    const now = new Date();

    const kyc: KYC = {
      ...kycData,
      id: kycRef.id,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(kycRef, {
      ...kyc,
      submittedAt: kyc.submittedAt.toISOString(),
      reviewedAt: kyc.reviewedAt?.toISOString(),
      personalInfo: {
        ...kyc.personalInfo,
        dateOfBirth: kyc.personalInfo.dateOfBirth.toISOString(),
      },
      documents: this.convertDocumentsToFirestore(kyc.documents),
      createdAt: kyc.createdAt.toISOString(),
      updatedAt: kyc.updatedAt.toISOString(),
    });

    return kyc;
  }

  // Get KYC by ID
  async getById(id: string): Promise<KYC | null> {
    const kycRef = doc(db, this.collectionName, id);
    const kycSnap = await getDoc(kycRef);

    if (kycSnap.exists()) {
      const data = kycSnap.data();
      return this.convertFromFirestore(data, kycSnap.id);
    }

    return null;
  }

  // Get KYC by user ID
  async getByUserId(userId: string): Promise<KYC | null> {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return this.convertFromFirestore(data, doc.id);
    }

    return null;
  }

  // Get KYC applications by status
  async getByStatus(status: KYC['status'], limitCount = 50): Promise<KYC[]> {
    const q = query(
      collection(db, this.collectionName),
      where('status', '==', status),
      orderBy('submittedAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return this.convertFromFirestore(data, doc.id);
    });
  }

  // Update KYC application
  async update(id: string, updates: Partial<Omit<KYC, 'id' | 'createdAt'>>): Promise<void> {
    const kycRef = doc(db, this.collectionName, id);
    const updateData: any = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Convert dates to ISO strings
    if (updates.submittedAt) {
      updateData.submittedAt = updates.submittedAt.toISOString();
    }
    if (updates.reviewedAt) {
      updateData.reviewedAt = updates.reviewedAt.toISOString();
    }
    if (updates.personalInfo?.dateOfBirth) {
      updateData.personalInfo = {
        ...updates.personalInfo,
        dateOfBirth: updates.personalInfo.dateOfBirth.toISOString(),
      };
    }
    if (updates.documents) {
      updateData.documents = this.convertDocumentsToFirestore(updates.documents);
    }

    await updateDoc(kycRef, updateData);
  }

  // Update KYC status
  async updateStatus(
    id: string,
    status: KYC['status'],
    reviewedBy?: string,
    rejectionReason?: string,
    notes?: string
  ): Promise<void> {
    const updates: any = {
      status,
      reviewedAt: new Date(),
    };

    if (reviewedBy) updates.reviewedBy = reviewedBy;
    if (rejectionReason) updates.rejectionReason = rejectionReason;
    if (notes) updates.notes = notes;

    await this.update(id, updates);
  }

  // Approve KYC application
  async approve(id: string, reviewedBy: string, notes?: string): Promise<void> {
    await this.updateStatus(id, 'approved', reviewedBy, undefined, notes);
  }

  // Reject KYC application
  async reject(id: string, reviewedBy: string, rejectionReason: string, notes?: string): Promise<void> {
    await this.updateStatus(id, 'rejected', reviewedBy, rejectionReason, notes);
  }

  // Request changes for KYC application
  async requestChanges(id: string, reviewedBy: string, notes: string): Promise<void> {
    await this.updateStatus(id, 'requires_changes', reviewedBy, undefined, notes);
  }

  // Add document to KYC application
  async addDocument(
    id: string,
    documentType: 'idCard' | 'passport' | 'utilityBill' | 'selfie',
    url: string
  ): Promise<void> {
    const kyc = await this.getById(id);
    if (!kyc) throw new Error('KYC application not found');

    const documents = { ...kyc.documents };
    documents[documentType] = {
      url,
      uploadedAt: new Date(),
      verified: false,
    };

    await this.update(id, { documents });
  }

  // Verify document
  async verifyDocument(
    id: string,
    documentType: 'idCard' | 'passport' | 'utilityBill' | 'selfie',
    verified: boolean
  ): Promise<void> {
    const kyc = await this.getById(id);
    if (!kyc) throw new Error('KYC application not found');

    if (!kyc.documents[documentType]) {
      throw new Error('Document not found');
    }

    const documents = { ...kyc.documents };
    documents[documentType]!.verified = verified;

    await this.update(id, { documents });
  }

  // Get KYC statistics (admin function)
  async getStatistics(): Promise<{
    total: number;
    pending: number;
    underReview: number;
    approved: number;
    rejected: number;
    requiresChanges: number;
  }> {
    const q = query(collection(db, this.collectionName));
    const querySnapshot = await getDocs(q);

    const stats = {
      total: querySnapshot.size,
      pending: 0,
      underReview: 0,
      approved: 0,
      rejected: 0,
      requiresChanges: 0,
    };

    querySnapshot.forEach(doc => {
      const data = doc.data();
      switch (data.status) {
        case 'pending':
          stats.pending++;
          break;
        case 'under_review':
          stats.underReview++;
          break;
        case 'approved':
          stats.approved++;
          break;
        case 'rejected':
          stats.rejected++;
          break;
        case 'requires_changes':
          stats.requiresChanges++;
          break;
      }
    });

    return stats;
  }

  // Get recent KYC applications (admin function)
  async getRecent(limitCount = 20): Promise<KYC[]> {
    const q = query(
      collection(db, this.collectionName),
      orderBy('submittedAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return this.convertFromFirestore(data, doc.id);
    });
  }

  // Get all KYC applications (admin function)
  async getAll(limitCount = 100): Promise<KYC[]> {
    const q = query(
      collection(db, this.collectionName),
      orderBy('submittedAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return this.convertFromFirestore(data, doc.id);
    });
  }

  // Helper method to convert documents to Firestore format
  private convertDocumentsToFirestore(documents: KYC['documents']): any {
    const result: any = {};

    Object.entries(documents).forEach(([key, doc]) => {
      if (doc) {
        result[key] = {
          ...doc,
          uploadedAt: doc.uploadedAt.toISOString(),
        };
      }
    });

    return result;
  }

  // Helper method to convert from Firestore format
  private convertFromFirestore(data: any, id: string): KYC {
    return {
      ...data,
      id,
      submittedAt: new Date(data.submittedAt),
      reviewedAt: data.reviewedAt ? new Date(data.reviewedAt) : undefined,
      verifiedAt: data.verifiedAt ? new Date(data.verifiedAt) : undefined,
      personalInfo: {
        ...data.personalInfo,
        dateOfBirth: new Date(data.personalInfo.dateOfBirth),
      },
      documents: this.convertDocumentsFromFirestore(data.documents),
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };
  }

  // Helper method to convert documents from Firestore format
  private convertDocumentsFromFirestore(documents: any): KYC['documents'] {
    const result: KYC['documents'] = {};

    if (documents) {
      Object.entries(documents).forEach(([key, doc]: [string, any]) => {
        if (doc) {
          result[key as keyof KYC['documents']] = {
            ...doc,
            uploadedAt: new Date(doc.uploadedAt),
          };
        }
      });
    }

    return result;
  }
}

export const kycCollection = new KYCCollection();
