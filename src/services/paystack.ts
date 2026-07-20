export interface PaystackConfig {
  publicKey: string;
  email: string;
  amount: number;
  currency?: string;
  channels?: string[];
}

export interface PaystackResponse {
  status: 'success' | 'cancelled' | 'error';
  transactionRef?: string;
  data?: any;
}

class PaystackService {
  public publicKey: string;

  constructor() {
    // Get Paystack public key from environment variables
    this.publicKey = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_your_key_here';

    if (this.publicKey === 'pk_test_your_key_here') {
      console.warn('⚠️ Paystack public key not configured. Please set EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY in your environment variables.');
    }
  }

  async initializePayment(config: PaystackConfig): Promise<PaystackResponse> {
    return new Promise((resolve) => {
      // This will be handled by the Paystack WebView component
      // The actual payment flow is managed in the UI component
      resolve({
        status: 'success',
        transactionRef: `tx_${Date.now()}`,
      });
    });
  }

  async verifyPayment(reference: string): Promise<boolean> {
    try {
      // TODO: Implement server-side verification
      // const response = await fetch(`${API_BASE_URL}/api/paystack/verify/${reference}`);
      // const data = await response.json();
      // return data.status === 'success';

      // Mock verification for now
      return true;
    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    }
  }

  formatAmount(amount: number): number {
    // Paystack expects amount in kobo (smallest currency unit)
    // For NGN, multiply by 100 to convert to kobo
    return Math.round(amount * 100);
  }

  formatAmountForDisplay(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  }

  generateReference(): string {
    return `givta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const paystackService = new PaystackService();
export default paystackService;
