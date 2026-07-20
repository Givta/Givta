// NEW CHALLENGE SYSTEM COLLECTIONS
// Matches the backend schema v2

import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, addDoc, query, where, getDocs, orderBy, limit, Timestamp, arrayUnion, arrayRemove } from 'firebase/firestore';

// Updated interfaces matching backend schema
export type ChallengeType = 'personal' | 'competition' | 'sponsored';
export type ChallengeStatus = 'draft' | 'active' | 'running' | 'ended' | 'paid_out' | 'cancelled';

export interface ChallengeParticipant {
  id?: string;
  challengeId: string;
  userId: string;
  username: string;
  avatarUrl?: string;

  // Participation
  joinedAt: Timestamp;
  entryFeePaid: number;

  // Tipping activity
  totalTipsReceived: number;
  totalTipsGiven: number;
  tipCount: number;

  // Rewards and Bonuses
  prizeAmount?: number;
  bonusAmount?: number;
  bonusPercentage?: number;

  // Media uploads for competitions
  mediaUrls?: string[];
  mediaDescription?: string;

  // Rankings
  currentRank?: number;
  finalRank?: number;

  // Status
  isActive: boolean;
  isDisqualified: boolean;
  disqualifiedReason?: string;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChallengeTip {
  id?: string;
  challengeId: string;
  participantId: string; // Who receives the tip
  tipperId: string; // Who sends the tip

  amount: number;
  currency: string;
  fee: number; // 5% platform fee
  netAmount: number; // Amount after fee

  message?: string;
  isAnonymous: boolean;

  // Payment tracking
  transactionId?: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'cancelled';

  // Timing
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChallengeVote {
  id?: string;
  challengeId: string;
  voterId: string;
  voteType: 'upvote' | 'downvote';

  // Optional weighting for different voting power
  weight: number;

  createdAt: Timestamp;
}

export interface Sponsor {
  id?: string;
  userId: string;
  brandName: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;

  // Branding
  logoUrl?: string;
  brandColors?: {
    primary: string;
    secondary: string;
  };

  // Activity tracking
  totalFunding: number;
  totalChallenges: number;
  activeChallenges: number;

  // Verification
  isVerified: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationDocuments?: string[];

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

export interface ChallengeSponsorFunding {
  id?: string;
  challengeId: string;
  sponsorId: string;
  amount: number;
  currency: string;

  // Funding status
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;

  // Terms
  fundingType: 'prize_increase' | 'entry_fee_subsidy' | 'full_sponsorship';
  termsAccepted: boolean;

  // Timing
  fundedAt: Timestamp;
  createdAt: Timestamp;
}

// MAIN CHALLENGE INTERFACE (v2)
export interface Challenge {
  id?: string;
  userId: string; // Challenge creator
  sponsorId?: string; // For sponsored challenges
  type: ChallengeType;

  // Basic Info
  title: string;
  description?: string;
  category: string;
  shortDescription?: string;

  // Financial
  entryFee: number; // 0 for free challenges
  currency: string;
  totalPrizePool?: number; // Calculated prize pool
  sponsorContribution?: number; // Sponsor's funding amount

  // Status & Timing
  status: ChallengeStatus;
  startDate: Timestamp;
  endDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  paidOutAt?: Timestamp;

  // Media & Social
  coverImageUrl?: string;
  mediaUrls?: string[];
  hashtags?: string[];
  socialMessage?: string;

  // Analytics & Tracking
  totalTips: number;
  totalAmount: number;
  totalParticipants: number;
  totalViews: number;
  totalShares: number;

  // Competition settings
  maxParticipants?: number;
  allowLateJoin?: boolean;
  prizeSplitRatios?: { 1: number; 2: number; 3: number }; // {1: 60, 2: 30, 3: 10}

  // Personal challenge settings
  goalAmount?: number; // Target amount for personal challenges
  currentAmount?: number; // Current progress
  bonusPercentage?: number; // 2-10% based on achievement

  // Sponsor settings
  sponsorName?: string;
  sponsorLogoUrl?: string;
  sponsorDescription?: string;
  sponsorWebsite?: string;

  // Venue information
  venueType?: 'physical' | 'online' | 'social_media';
  venueAddress?: string;
  venueLink?: string;
  venueDetails?: string;

  // Links & URLs
  shareableUrl: string;
  customSlug?: string;

  // Metadata
  isPublic: boolean;
  isDeleted: boolean;
  tags?: string[];

  // Voting (for competitions)
  upvotes: number;
  downvotes: number;
}

// =====================================
// NEW CHALLENGE COLLECTIONS (v2)
// =====================================

// Collection names matching backend v2 schema
const COLLECTIONS = {
  CHALLENGES: 'challenges_v2',
  CHALLENGE_PARTICIPANTS: 'challenge_participants_v2',
  CHALLENGE_TIPS: 'challenge_tips_v2',
  CHALLENGE_VOTES: 'challenge_votes_v2',
  SPONSORS: 'sponsors_v2',
  CHALLENGE_SPONSOR_FUNDING: 'challenge_sponsor_funding_v2'
};

export class ChallengesCollection {
  private static collectionName = COLLECTIONS.CHALLENGES;

  // Create a new challenge
  static async create(challengeData: Omit<Challenge, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const docData = {
        ...challengeData,
        createdAt: now,
        updatedAt: now,
        totalTips: challengeData.totalTips || 0,
        totalAmount: challengeData.totalAmount || 0,
        totalParticipants: challengeData.totalParticipants || 0,
        totalViews: challengeData.totalViews || 0,
        totalShares: challengeData.totalShares || 0,
        upvotes: challengeData.upvotes || 0,
        downvotes: challengeData.downvotes || 0,
        isDeleted: false,
      };

      const docRef = await addDoc(collection(db, this.collectionName), docData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  }

  // Get challenge by ID
  static async getById(id: string): Promise<Challenge | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        return {
          id,
          ...data,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting challenge:', error);
      throw error;
    }
  }

  // Get challenges by user
  static async getByUserId(userId: string, limitCount: number = 20): Promise<Challenge[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Challenge));
    } catch (error) {
      console.error('Error getting challenges by user:', error);
      throw error;
    }
  }

  // Get public challenges by type
  static async getPublicByType(type: ChallengeType, limitCount: number = 50): Promise<Challenge[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('isPublic', '==', true),
        where('type', '==', type),
        where('status', 'in', ['active', 'running', 'ended']),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Challenge));
    } catch (error) {
      console.error('Error getting public challenges by type:', error);
      throw error;
    }
  }

  // Get trending challenges
  static async getTrending(limitCount: number = 20): Promise<Challenge[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('isPublic', '==', true),
        where('status', 'in', ['active', 'running', 'ended']),
        where('isDeleted', '==', false),
        orderBy('totalViews', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Challenge));
    } catch (error) {
      console.error('Error getting trending challenges:', error);
      throw error;
    }
  }

  // Update challenge
  static async update(id: string, updates: Partial<Challenge>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating challenge:', error);
      throw error;
    }
  }

  // Soft delete challenge
  static async delete(id: string): Promise<void> {
    try {
      await this.update(id, { isDeleted: true });
    } catch (error) {
      console.error('Error deleting challenge:', error);
      throw error;
    }
  }

  // Increment view count
  static async incrementView(id: string): Promise<void> {
    try {
      const challenge = await this.getById(id);
      if (!challenge) return;

      await this.update(id, {
        totalViews: (challenge.totalViews || 0) + 1,
      });
    } catch (error) {
      console.error('Error incrementing view:', error);
    }
  }

  // Increment share count
  static async incrementShare(id: string): Promise<void> {
    try {
      const challenge = await this.getById(id);
      if (!challenge) return;

      await this.update(id, {
        totalShares: (challenge.totalShares || 0) + 1,
      });
    } catch (error) {
      console.error('Error incrementing share:', error);
    }
  }
}

export class ChallengeParticipantsCollection {
  private static collectionName = COLLECTIONS.CHALLENGE_PARTICIPANTS;

  // Join a challenge as participant
  static async joinChallenge(participantData: Omit<ChallengeParticipant, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...participantData,
        createdAt: now,
        updatedAt: now,
        isActive: true,
        isDisqualified: false,
      });
      return docRef.id;
    } catch (error) {
      console.error('Error joining challenge:', error);
      throw error;
    }
  }

  // Get participants by challenge
  static async getByChallengeId(challengeId: string): Promise<ChallengeParticipant[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('challengeId', '==', challengeId),
        orderBy('totalTipsReceived', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as ChallengeParticipant));
    } catch (error) {
      console.error('Error getting challenge participants:', error);
      throw error;
    }
  }

  // Update participant
  static async update(id: string, updates: Partial<ChallengeParticipant>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating participant:', error);
      throw error;
    }
  }
}

export class ChallengeTipsCollection {
  private static collectionName = COLLECTIONS.CHALLENGE_TIPS;

  // Create a tip
  static async create(tipData: Omit<ChallengeTip, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const fee = tipData.amount * 0.05; // 5% platform fee
      const netAmount = tipData.amount - fee;

      const docRef = await addDoc(collection(db, this.collectionName), {
        ...tipData,
        fee,
        netAmount,
        createdAt: now,
        updatedAt: now,
        paymentStatus: 'completed', // Assume immediate completion for now
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating tip:', error);
      throw error;
    }
  }

  // Get tips by challenge
  static async getByChallengeId(challengeId: string, limitCount: number = 50): Promise<ChallengeTip[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('challengeId', '==', challengeId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as ChallengeTip));
    } catch (error) {
      console.error('Error getting challenge tips:', error);
      throw error;
    }
  }

  // Get tips by participant
  static async getByParticipantId(participantId: string): Promise<ChallengeTip[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('participantId', '==', participantId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as any));
    } catch (error) {
      console.error('Error getting tips by participant:', error);
      throw error;
    }
  }
}

export class ChallengeVotesCollection {
  private static collectionName = COLLECTIONS.CHALLENGE_VOTES;

  // Submit a vote
  static async vote(voteData: Omit<ChallengeVote, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...voteData,
        weight: 1, // Default weight
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error submitting vote:', error);
      throw error;
    }
  }

  // Get votes by challenge
  static async getByChallengeId(challengeId: string): Promise<ChallengeVote[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('challengeId', '==', challengeId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as ChallengeVote));
    } catch (error) {
      console.error('Error getting challenge votes:', error);
      throw error;
    }
  }

  // Get vote totals by challenge
  static async getVoteTotals(challengeId: string): Promise<{ upvotes: number; downvotes: number }> {
    try {
      const votes = await this.getByChallengeId(challengeId);
      const upvotes = votes.filter(v => v.voteType === 'upvote').length;
      const downvotes = votes.filter(v => v.voteType === 'downvote').length;

      return { upvotes, downvotes };
    } catch (error) {
      console.error('Error getting vote totals:', error);
      throw error;
    }
  }
}

export class SponsorsCollection {
  private static collectionName = COLLECTIONS.SPONSORS;

  // Create/update sponsor profile
  static async createOrUpdate(sponsorData: Omit<Sponsor, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();

      // Check if sponsor already exists
      const existingSponsor = await this.getByUserId(sponsorData.userId);
      if (existingSponsor) {
        await this.update(existingSponsor.id!, sponsorData);
        return existingSponsor.id!;
      }

      const docRef = await addDoc(collection(db, this.collectionName), {
        ...sponsorData,
        totalFunding: 0,
        totalChallenges: 0,
        activeChallenges: 0,
        isVerified: false,
        verificationStatus: 'pending',
        createdAt: now,
        updatedAt: now,
        isActive: true,
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating sponsor:', error);
      throw error;
    }
  }

  // Get sponsor by user ID
  static async getByUserId(userId: string): Promise<Sponsor | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as Sponsor;
      }
      return null;
    } catch (error) {
      console.error('Error getting sponsor by user ID:', error);
      throw error;
    }
  }

  // Update sponsor
  static async update(id: string, updates: Partial<Sponsor>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating sponsor:', error);
      throw error;
    }
  }

  // Get all verified sponsors
  static async getVerifiedSponsors(limitCount: number = 20): Promise<Sponsor[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('isVerified', '==', true),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Sponsor));
    } catch (error) {
      console.error('Error getting verified sponsors:', error);
      throw error;
    }
  }
}

// Sample data population helper
export class ChallengeCollectionsDataHelper {
  // Method to populate sample challenges
  static async populateSampleChallenges(): Promise<void> {
    try {
      const sampleChallenges: Partial<Challenge>[] = [
        {
          userId: 'sample-user-1',
          type: 'personal',
          title: 'Weight Loss Journey',
          description: 'Join me as I work towards losing 20kg in 6 months',
          category: 'fitness',
          entryFee: 1000,
          currency: 'NGN',
          status: 'active',
          isPublic: true,
          shareableUrl: 'https://givta.ng/challenge/weight-loss-journey',
          startDate: Timestamp.now(),
          endDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days from now
          goalAmount: 50000,
          bonusPercentage: 5,
          totalTips: 0,
          totalAmount: 0,
          totalParticipants: 0,
          totalViews: 0,
          totalShares: 0,
          upvotes: 0,
          downvotes: 0,
        },
        {
          userId: 'sample-user-2',
          type: 'competition',
          title: 'Dance Off Championship',
          description: 'Best dancers compete for ₦100,000 prize pool!',
          category: 'entertainment',
          entryFee: 2000,
          currency: 'NGN',
          status: 'active',
          isPublic: true,
          shareableUrl: 'https://givta.ng/challenge/dance-championship',
          startDate: Timestamp.now(),
          endDate: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)), // 14 days from now
          maxParticipants: 50,
          prizeSplitRatios: { 1: 60, 2: 30, 3: 10 },
          totalTips: 0,
          totalAmount: 0,
          totalParticipants: 0,
          totalViews: 0,
          totalShares: 0,
          upvotes: 0,
          downvotes: 0,
        },
        {
          userId: 'sample-user-3',
          type: 'sponsored',
          sponsorId: 'sample-sponsor-1',
          title: 'Fitness Brand Transformation Challenge',
          description: 'Sponsored by FitWell - Transform your body with professional guidance',
          category: 'fitness',
          entryFee: 0,
          currency: 'NGN',
          sponsorContribution: 150000,
          status: 'active',
          isPublic: true,
          shareableUrl: 'https://givta.ng/challenge/fitwell-sponsored',
          startDate: Timestamp.now(),
          endDate: Timestamp.fromDate(new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)), // 21 days from now
          maxParticipants: 100,
          prizeSplitRatios: { 1: 60, 2: 30, 3: 10 },
          sponsorName: 'FitWell Nigeria',
          sponsorLogoUrl: 'https://example.com/fitwell-logo.png',
          sponsorWebsite: 'https://fitwell.ng',
          sponsorDescription: 'Premium fitness equipment and supplements',
          totalTips: 0,
          totalAmount: 0,
          totalParticipants: 0,
          totalViews: 0,
          totalShares: 0,
          upvotes: 0,
          downvotes: 0,
        }
      ];

      for (const challenge of sampleChallenges) {
        try {
          const challengeId = await ChallengesCollection.create(challenge as Challenge);
          console.log(`Created sample challenge: ${challengeId} - ${challenge.title}`);
        } catch (error) {
          console.error(`Error creating challenge "${challenge.title}":`, error);
        }
      }

      console.log('Sample challenges populated successfully!');
    } catch (error) {
      console.error('Error populating sample challenges:', error);
      throw error;
    }
  }

  // Method to populate sample sponsor
  static async populateSampleSponsor(): Promise<void> {
    try {
      const sampleSponsor: Omit<Sponsor, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: 'sample-sponsor-user',
        brandName: 'FitWell Nigeria',
        contactEmail: 'partnerships@fitwell.ng',
        contactPhone: '+234123456789',
        website: 'https://fitwell.ng',
        logoUrl: 'https://example.com/fitwell-logo.png',
        brandColors: {
          primary: '#4B0082',
          secondary: '#32CD32'
        },
        totalFunding: 500000,
        totalChallenges: 5,
        activeChallenges: 2,
        isVerified: true,
        verificationStatus: 'verified',
        verificationDocuments: ['business-registration.pdf', 'tax-certificate.pdf'],
        isActive: true,
      };

      const sponsorId = await SponsorsCollection.createOrUpdate(sampleSponsor);
      console.log(`Created sample sponsor: ${sponsorId}`);

    } catch (error) {
      console.error('Error creating sample sponsor:', error);
      throw error;
    }
  }
}
