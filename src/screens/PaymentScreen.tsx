import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, Alert, ScrollView,
  Modal, TouchableOpacity, FlatList, SafeAreaView,
  ActivityIndicator, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { PaystackWebView } from '../components/PaystackWebView';
import { apiService } from '../services/api';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  brand:      '#6A0DAD',
  brandLight: '#8B2BE2',
  brandFaint: '#F3EAFF',
  brandMid:   'rgba(106,13,173,0.12)',
  green:      '#22C55E',
  greenFaint: '#F0FFF4',
  red:        '#EF4444',
  redFaint:   '#FEF2F2',
  amber:      '#F59E0B',
  bg:         '#F7F5FB',
  surface:    '#FFFFFF',
  border:     '#E8DFF5',
  overlay:    'rgba(15,5,35,0.6)',
  textPrimary:'#1A1035',
  textSub:    '#6B6480',
  textMuted:  '#A89FC0',
  white:      '#FFFFFF',
};

type PaymentType = 'deposit' | 'withdraw';

const Handle = () => (
  <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 2 }}>
    <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C.border }} />
  </View>
);

// ─── Bank Picker Modal ────────────────────────────────────────────────────────
const BankPickerModal: React.FC<{
  visible: boolean;
  banks: any[];
  loading: boolean;
  onSelect: (bank: any) => void;
  onClose: () => void;
}> = ({ visible, banks, loading, onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const filtered = banks.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={bm.overlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={bm.sheet}>
          <Handle />
          <View style={bm.header}>
            <Text style={bm.title}>Select Bank</Text>
            <TouchableOpacity style={bm.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color={C.textSub} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={bm.searchWrap}>
            <Ionicons name="search-outline" size={15} color={C.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={bm.searchInput}
              placeholder="Search banks…"
              placeholderTextColor={C.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            {!!search && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={C.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={bm.loadingBox}>
              <ActivityIndicator color={C.brand} />
              <Text style={bm.loadingText}>Loading banks…</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => item.code}
              style={{ maxHeight: 380 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: C.border, marginHorizontal: 16 }} />}
              ListEmptyComponent={
                <View style={bm.loadingBox}>
                  <Text style={bm.loadingText}>No banks found</Text>
                </View>
              }
              renderItem={({ item }) => (
                <TouchableOpacity style={bm.bankRow} onPress={() => onSelect(item)} activeOpacity={0.75}>
                  <View style={bm.bankIconBox}>
                    <Ionicons name="business-outline" size={16} color={C.brand} />
                  </View>
                  <Text style={bm.bankName}>{item.name}</Text>
                  <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

// ─── Withdrawal Success Modal ─────────────────────────────────────────────────
const WithdrawSuccessModal: React.FC<{
  visible: boolean;
  amount: number;
  fee: number;
  net: number;
  accountName: string;
  bankName: string;
  fmt: (n: number) => string;
  onDone: () => void;
}> = ({ visible, amount, fee, net, accountName, bankName, fmt, onDone }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onDone}>
    <View style={wm.overlay}>
      <View style={wm.sheet}>
        <Handle />
        <View style={wm.iconRing}>
          <View style={wm.iconInner}>
            <Ionicons name="checkmark" size={32} color={C.white} />
          </View>
        </View>
        <Text style={wm.title}>Withdrawal Requested</Text>
        <Text style={wm.sub}>
          Your request is under review. We'll process it within 1–3 business days.
        </Text>

        <View style={wm.summaryBox}>
          <View style={wm.summaryRow}>
            <Text style={wm.summaryLabel}>Amount</Text>
            <Text style={wm.summaryValue}>{fmt(amount)}</Text>
          </View>
          <View style={wm.summaryRow}>
            <Text style={wm.summaryLabel}>Platform fee (2.3%)</Text>
            <Text style={[wm.summaryValue, { color: C.red }]}>−{fmt(fee)}</Text>
          </View>
          <View style={[wm.summaryRow, wm.summaryDivider]}>
            <Text style={[wm.summaryLabel, { fontWeight: '800', color: C.textPrimary }]}>You'll receive</Text>
            <Text style={[wm.summaryValue, { color: C.green, fontWeight: '900', fontSize: 16 }]}>{fmt(net)}</Text>
          </View>
          <View style={wm.summaryRow}>
            <Text style={wm.summaryLabel}>To account</Text>
            <Text style={wm.summaryValue} numberOfLines={1}>{accountName}</Text>
          </View>
          <View style={wm.summaryRow}>
            <Text style={wm.summaryLabel}>Bank</Text>
            <Text style={wm.summaryValue}>{bankName}</Text>
          </View>
        </View>

        <TouchableOpacity style={wm.doneBtn} onPress={onDone}>
          <Text style={wm.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const PaymentScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: { paymentType: PaymentType } }, 'params'>>();
  const { user }   = useAuth();
  const { balance, refreshBalance } = useWallet();

  const paymentType   = route.params?.paymentType || 'deposit';
  const isDeposit     = paymentType === 'deposit';

  const [amount, setAmount]                   = useState('');
  const [loading, setLoading]                 = useState(false);
  const [showPaystack, setShowPaystack]       = useState(false);
  const [paymentUrl, setPaymentUrl]           = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  // Web-only: react-native-webview doesn't run on web at all, so the
  // native flow above (embed checkout in a WebView modal) just spins
  // forever there. On web we open checkout in a new tab instead and poll
  // for completion here.
  const [webPaymentPending, setWebPaymentPending] = useState(false);

  // Withdrawal fields
  const [accountNumber, setAccountNumber]     = useState('');
  const [bankCode, setBankCode]               = useState('');
  const [selectedBank, setSelectedBank]       = useState<any>(null);
  const [accountName, setAccountName]         = useState('');
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [showBankPicker, setShowBankPicker]   = useState(false);
  const [availableBanks, setAvailableBanks]   = useState<any[]>([]);
  const [loadingBanks, setLoadingBanks]       = useState(false);
  const [showWithdrawSuccess, setShowWithdrawSuccess] = useState(false);
  const [lastWithdrawal, setLastWithdrawal]   = useState({ amount: 0, fee: 0, net: 0 });

  const numAmount  = parseFloat(amount) || 0;
  const fee        = Math.round(numAmount * 0.023);
  const netAmount  = numAmount - fee;
  const hasAmount  = numAmount > 0;

  const QUICK_AMOUNTS = isDeposit ? [1000, 2000, 5000, 10000] : [500, 1000, 2000, 5000];

  useEffect(() => { if (!isDeposit) loadBanks(); }, [isDeposit]);

  const loadBanks = async () => {
    setLoadingBanks(true);
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/payments/banks`, {
        headers: { 'Authorization': `Bearer ${user?.tokens?.accessToken}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAvailableBanks(
          data.data
            .filter((b: any) => b.active && !b.name.includes('Test'))
            .sort((a: any, b: any) => a.name.localeCompare(b.name))
        );
      }
    } catch (e) { console.error(e); }
    finally { setLoadingBanks(false); }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n);

  const handlePayment = async () => {
    if (!user)          return Alert.alert('Not logged in', 'Please log in to continue.');
    if (numAmount <= 0) return Alert.alert('Enter amount', 'Type how much you want to ' + (isDeposit ? 'deposit' : 'withdraw') + '.');
    if (!isDeposit && numAmount > balance) return Alert.alert('Insufficient balance', "You don't have enough funds.");
    if (!isDeposit && (!accountNumber || accountNumber.length !== 10 || !bankCode || !accountName))
      return Alert.alert('Incomplete details', 'Verify your bank account before withdrawing.');
    isDeposit ? handleDeposit() : handleWithdrawal();
  };

  const handleDeposit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/wallets/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.tokens?.accessToken}`,
        },
        body: JSON.stringify({ amount: numAmount }),
      });
      const data = await res.json();
      if (data.success) {
        setPaymentReference(data.data.reference);

        if (Platform.OS === 'web') {
          // react-native-webview has no web implementation — mounting it
          // here just spins forever with nothing ever loading. Open
          // checkout in its own tab and poll our own backend for
          // completion instead; works the same regardless of which
          // payment provider is active, and doesn't depend on Squad (or
          // any provider) redirecting back to a specific callback URL,
          // since none is currently configured.
          const webWindow = (globalThis as any).window;
          const win = webWindow?.open(data.data.paymentUrl, '_blank');
          setWebPaymentPending(true);
          pollWebPaymentStatus(data.data.reference, win);
        } else {
          setPaymentUrl(data.data.paymentUrl);
          setShowPaystack(true);
        }
      } else throw new Error(data.error || 'Failed to initialise deposit');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to start payment');
    } finally { setLoading(false); }
  };

  // Web-only. Checks payment status every 3s for up to 5 minutes. Stops
  // early if the user closes the checkout tab without paying (nothing to
  // wait for at that point) or navigates away from this screen.
  const pollWebPaymentStatus = (reference: string, checkoutWindow?: any) => {
    let attempts = 0;
    const maxAttempts = 100; // ~5 minutes at 3s intervals
    const interval = setInterval(async () => {
      attempts += 1;
      try {
        const result = await apiService.verifyPayment(reference);
        const status = (result as any)?.data?.status;

        if (status === 'success') {
          clearInterval(interval);
          setWebPaymentPending(false);
          await refreshBalance();
          Alert.alert('Payment successful 🎉', 'Your wallet has been credited.');
          navigation.goBack();
          return;
        }

        if (status === 'failed' || status === 'abandoned') {
          clearInterval(interval);
          setWebPaymentPending(false);
          Alert.alert('Payment not completed', 'The payment was not successful. You can try again.');
          return;
        }
      } catch {
        // Transient network/verify error — just try again next tick.
      }

      // If the user closed the checkout tab, give the webhook a little
      // extra time to land (it can lag slightly behind the redirect)
      // rather than stopping immediately, but don't wait the full 5
      // minutes for a tab that's already gone.
      if (checkoutWindow?.closed && attempts > 5) {
        clearInterval(interval);
        setWebPaymentPending(false);
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setWebPaymentPending(false);
        Alert.alert(
          'Still processing',
          "This is taking longer than usual. If you completed the payment, your balance will update shortly — you can also check back on the wallet screen."
        );
      }
    }, 3000);
  };

  const handleWithdrawal = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/wallets/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.tokens?.accessToken}`,
        },
        body: JSON.stringify({
          amount: numAmount,
          accountNumber: accountNumber.trim(),
          bankCode: bankCode.trim(),
          bankName: selectedBank?.name || '',
          accountName: accountName.trim(),
          description: 'Withdrawal from Givta app',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLastWithdrawal({ amount: numAmount, fee, net: netAmount });
        setShowWithdrawSuccess(true);
      } else throw new Error(data.error || 'Withdrawal failed');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit withdrawal');
    } finally { setLoading(false); }
  };

  const handleVerifyAccount = async () => {
    if (accountNumber.length !== 10) return Alert.alert('Invalid', 'Account number must be 10 digits.');
    if (!bankCode) return Alert.alert('Select bank', 'Please choose a bank first.');
    setVerifyingAccount(true);
    try {
      const result = await apiService.validateBankAccount(accountNumber.trim(), bankCode.trim());
      if (result.success && result.data) {
        setAccountName(result.data.account_name);
      } else {
        Alert.alert('Verification failed', 'Could not verify this account. Check the details and try again.');
      }
    } catch {
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally { setVerifyingAccount(false); }
  };

  const handlePaystackSuccess = async () => {
    setShowPaystack(false);
    await refreshBalance();
    Alert.alert('Payment successful 🎉', 'Your wallet has been credited.');
    navigation.goBack();
  };

  const canSubmit = isDeposit
    ? hasAmount
    : hasAmount && numAmount <= balance && accountNumber.length === 10 && !!bankCode && !!accountName;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={C.white} />
        </TouchableOpacity>
        <View>
          <Text style={s.topTitle}>{isDeposit ? 'Deposit Funds' : 'Withdraw Funds'}</Text>
          <Text style={s.topSub}>{isDeposit ? 'Add money to your wallet' : 'Cash out your earnings'}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Balance pill */}
          <View style={s.balancePill}>
            <Ionicons name="wallet-outline" size={14} color={C.brand} />
            <Text style={s.balancePillLabel}>Wallet balance</Text>
            <Text style={s.balancePillValue}>{fmt(balance)}</Text>
          </View>

          {/* Amount card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>{isDeposit ? 'How much to deposit?' : 'How much to withdraw?'}</Text>

            {/* Big amount input */}
            <View style={[s.amountWrap, hasAmount && s.amountWrapActive]}>
              <Text style={[s.amountSymbol, { color: hasAmount ? C.brand : C.textMuted }]}>₦</Text>
              <TextInput
                style={s.amountInput}
                placeholder="0.00"
                placeholderTextColor={C.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            {/* Quick chips */}
            <View style={s.quickRow}>
              {QUICK_AMOUNTS.map(q => (
                <TouchableOpacity
                  key={q}
                  style={[s.quickChip, amount === String(q) && s.quickChipActive]}
                  onPress={() => setAmount(String(q))}
                >
                  <Text style={[s.quickChipText, amount === String(q) && s.quickChipTextActive]}>
                    ₦{q >= 1000 ? `${q / 1000}k` : q}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Withdrawal bank details ── */}
            {!isDeposit && (
              <View style={s.bankSection}>
                <Text style={s.bankSectionTitle}>Bank Account Details</Text>

                {/* Account number */}
                <Text style={s.fieldLabel}>Account number</Text>
                <View style={[s.fieldWrap, accountNumber.length === 10 && s.fieldWrapSuccess]}>
                  <Ionicons name="card-outline" size={16} color={accountNumber.length === 10 ? C.green : C.textMuted} style={{ marginRight: 10 }} />
                  <TextInput
                    style={s.fieldInput}
                    placeholder="10-digit account number"
                    placeholderTextColor={C.textMuted}
                    value={accountNumber}
                    onChangeText={(v) => { setAccountNumber(v); setAccountName(''); }}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                  {accountNumber.length === 10 && (
                    <Ionicons name="checkmark-circle" size={18} color={C.green} />
                  )}
                </View>

                {/* Bank selector */}
                <Text style={s.fieldLabel}>Bank</Text>
                <TouchableOpacity
                  style={[s.fieldWrap, !!selectedBank && s.fieldWrapSuccess]}
                  onPress={() => setShowBankPicker(true)}
                >
                  <Ionicons name="business-outline" size={16} color={selectedBank ? C.green : C.textMuted} style={{ marginRight: 10 }} />
                  <Text style={[s.fieldInput, { color: selectedBank ? C.textPrimary : C.textMuted, paddingVertical: 0 }]}>
                    {selectedBank ? selectedBank.name : 'Choose a bank'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={C.textMuted} />
                </TouchableOpacity>

                {/* Account name or verify button */}
                {accountName ? (
                  <View style={s.verifiedBox}>
                    <Ionicons name="checkmark-circle" size={16} color={C.green} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.verifiedLabel}>Account holder</Text>
                      <Text style={s.verifiedName}>{accountName}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setAccountName('')}>
                      <Ionicons name="close-circle-outline" size={18} color={C.textMuted} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[s.verifyBtn,
                      (verifyingAccount || accountNumber.length !== 10 || !selectedBank) && s.verifyBtnDisabled]}
                    onPress={handleVerifyAccount}
                    disabled={verifyingAccount || accountNumber.length !== 10 || !selectedBank}
                  >
                    {verifyingAccount
                      ? <ActivityIndicator size="small" color={C.brand} />
                      : <Ionicons name="search" size={16} color={C.brand} />
                    }
                    <Text style={s.verifyBtnText}>
                      {verifyingAccount ? 'Verifying…' : 'Verify account'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Fee summary */}
            {hasAmount && (
              <View style={s.feeBox}>
                <Text style={s.feeBoxTitle}>Summary</Text>
                {isDeposit ? (
                  <>
                    <View style={s.feeRow}>
                      <Text style={s.feeLabel}>Deposit amount</Text>
                      <Text style={s.feeValue}>{fmt(numAmount)}</Text>
                    </View>
                    <View style={s.feeRow}>
                      <Text style={s.feeLabel}>Processing fee</Text>
                      <Text style={[s.feeValue, { color: C.green }]}>Free</Text>
                    </View>
                    <View style={s.feeDivider} />
                    <View style={s.feeRow}>
                      <Text style={s.feeTotalLabel}>Wallet credited</Text>
                      <Text style={[s.feeTotalValue, { color: C.green }]}>{fmt(numAmount)}</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={s.feeRow}>
                      <Text style={s.feeLabel}>Withdrawal amount</Text>
                      <Text style={s.feeValue}>{fmt(numAmount)}</Text>
                    </View>
                    <View style={s.feeRow}>
                      <Text style={s.feeLabel}>Platform fee (2.3%)</Text>
                      <Text style={[s.feeValue, { color: C.red }]}>−{fmt(fee)}</Text>
                    </View>
                    {numAmount > balance && (
                      <View style={s.insufficientRow}>
                        <Ionicons name="warning-outline" size={13} color={C.red} />
                        <Text style={s.insufficientText}>Balance too low</Text>
                      </View>
                    )}
                    <View style={s.feeDivider} />
                    <View style={s.feeRow}>
                      <Text style={s.feeTotalLabel}>You'll receive</Text>
                      <Text style={[s.feeTotalValue, { color: C.brand }]}>{fmt(netAmount)}</Text>
                    </View>
                  </>
                )}
              </View>
            )}

            {/* CTA button */}
            <TouchableOpacity
              style={[s.ctaBtn, (!canSubmit || loading) && s.ctaBtnDisabled]}
              onPress={handlePayment}
              disabled={!canSubmit || loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={C.white} size="small" />
                : <>
                    <Ionicons
                      name={isDeposit ? 'card-outline' : 'arrow-up-circle-outline'}
                      size={18} color={C.white}
                    />
                    <Text style={s.ctaBtnText}>
                      {isDeposit ? 'Proceed to payment' : 'Withdraw funds'}
                    </Text>
                  </>
              }
            </TouchableOpacity>
          </View>

          {/* Info card */}
          <View style={s.infoCard}>
            <Text style={s.infoTitle}>Payment information</Text>
            {[
              {
                icon: isDeposit ? 'shield-checkmark-outline' : 'swap-horizontal-outline',
                text: isDeposit
                  ? 'Secure payment handled by our active gateway'
                  : 'Funds transferred to your verified account',
              },
              {
                icon: isDeposit ? 'flash-outline' : 'time-outline',
                text: isDeposit
                  ? 'Instant credit to your Givta wallet'
                  : 'Processing time: 1–3 business days',
              },
              {
                icon: 'lock-closed-outline',
                text: '256-bit SSL encryption protects every transaction',
              },
            ].map((item, i) => (
              <View key={i} style={s.infoRow}>
                <View style={s.infoIconBox}>
                  <Ionicons name={item.icon as any} size={16} color={C.brand} />
                </View>
                <Text style={s.infoText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Modals ── */}
      <BankPickerModal
        visible={showBankPicker}
        banks={availableBanks}
        loading={loadingBanks}
        onSelect={(bank) => {
          setSelectedBank(bank);
          setBankCode(bank.code);
          setShowBankPicker(false);
          setAccountName('');
        }}
        onClose={() => setShowBankPicker(false)}
      />

      <WithdrawSuccessModal
        visible={showWithdrawSuccess}
        amount={lastWithdrawal.amount}
        fee={lastWithdrawal.fee}
        net={lastWithdrawal.net}
        accountName={accountName}
        bankName={selectedBank?.name || ''}
        fmt={fmt}
        onDone={() => { setShowWithdrawSuccess(false); navigation.goBack(); }}
      />

      {/* Paystack WebView — native only, react-native-webview has no web build */}
      <Modal
        visible={showPaystack}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaystack(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: C.surface }}>
          {/* Close bar */}
          <View style={s.paystackBar}>
            <TouchableOpacity
              style={s.paystackClose}
              onPress={() => { setShowPaystack(false); Alert.alert('Payment cancelled', 'Your payment was not completed.'); }}
            >
              <Ionicons name="close" size={20} color={C.textPrimary} />
            </TouchableOpacity>
            <Text style={s.paystackTitle}>Secure Payment</Text>
            <View style={s.paystackLock}>
              <Ionicons name="lock-closed" size={13} color={C.green} />
              <Text style={s.paystackLockText}>SSL</Text>
            </View>
          </View>
          <PaystackWebView
            amount={numAmount}
            paymentUrl={paymentUrl}
            onSuccess={handlePaystackSuccess}
            onCancel={() => { setShowPaystack(false); Alert.alert('Payment cancelled', 'Your payment was not completed.'); }}
            reference={paymentReference}
          />
        </SafeAreaView>
      </Modal>

      {/* Web-only waiting screen — checkout happens in its own tab, this
          polls for completion instead of embedding a WebView. */}
      <Modal
        visible={webPaymentPending}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={wm.overlay}>
          <View style={[wm.sheet, { alignItems: 'center', paddingTop: 32 }]}>
            <ActivityIndicator size="large" color={C.brand} />
            <Text style={[wm.title, { marginTop: 20, fontSize: 18 }]}>Waiting for payment</Text>
            <Text style={wm.sub}>
              Complete your payment in the tab that just opened. This will update automatically once it's done.
            </Text>
            <TouchableOpacity
              style={[wm.doneBtn, { marginTop: 4 }]}
              onPress={() => {
                if (paymentReference) pollWebPaymentStatus(paymentReference);
              }}
            >
              <Text style={wm.doneBtnText}>I've completed payment</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginTop: 14, padding: 8 }}
              onPress={() => setWebPaymentPending(false)}
            >
              <Text style={{ color: C.textSub, fontSize: 13, fontWeight: '600' }}>Cancel and check later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Screen styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: C.brand },
  scroll: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 40 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20,
    backgroundColor: C.brand,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { fontSize: 20, fontWeight: '900', color: C.white, letterSpacing: -0.2, textAlign: 'center' },
  topSub:   { fontSize: 12, color: 'rgba(255,255,255,0.65)', textAlign: 'center', marginTop: 2 },

  balancePill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: C.brandFaint, borderRadius: 20, alignSelf: 'center',
    paddingHorizontal: 16, paddingVertical: 8, marginTop: 16, marginBottom: 16,
    borderWidth: 1, borderColor: C.border,
  },
  balancePillLabel: { fontSize: 12, color: C.textSub, fontWeight: '600' },
  balancePillValue: { fontSize: 14, fontWeight: '900', color: C.brand },

  card: {
    backgroundColor: C.surface, marginHorizontal: 16, borderRadius: 20, padding: 22,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: C.textPrimary, marginBottom: 18, letterSpacing: -0.2 },

  amountWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: C.border, borderRadius: 14,
    paddingHorizontal: 16, marginBottom: 14, backgroundColor: '#FAFAFA',
  },
  amountWrapActive: { borderColor: C.brand, backgroundColor: C.brandFaint },
  amountSymbol:  { fontSize: 24, fontWeight: '800', marginRight: 8 },
  amountInput: {
    flex: 1, fontSize: 28, fontWeight: '900', color: C.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10, letterSpacing: -0.5,
  },

  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  quickChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface,
  },
  quickChipActive:     { borderColor: C.brand, backgroundColor: C.brandFaint },
  quickChipText:       { fontSize: 13, fontWeight: '600', color: C.textSub },
  quickChipTextActive: { color: C.brand },

  // Bank section
  bankSection: {
    backgroundColor: C.bg, borderRadius: 14, padding: 16,
    marginBottom: 18, borderWidth: 1, borderColor: C.border,
  },
  bankSectionTitle: { fontSize: 14, fontWeight: '800', color: C.textPrimary, marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: C.textSub, marginBottom: 6, marginTop: 8 },
  fieldWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 12, backgroundColor: C.surface, minHeight: 48,
    marginBottom: 4,
  },
  fieldWrapSuccess: { borderColor: C.green, backgroundColor: C.greenFaint },
  fieldInput: {
    flex: 1, fontSize: 14, color: C.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },

  verifiedBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.greenFaint, borderRadius: 12, padding: 12, marginTop: 8,
    borderWidth: 1, borderColor: C.green + '40',
  },
  verifiedLabel: { fontSize: 11, color: C.textMuted, fontWeight: '600' },
  verifiedName:  { fontSize: 14, fontWeight: '800', color: C.textPrimary },

  verifyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: C.brand, borderRadius: 12, height: 44, marginTop: 10,
    backgroundColor: C.brandFaint,
  },
  verifyBtnDisabled: { borderColor: C.border, backgroundColor: C.bg, opacity: 0.5 },
  verifyBtnText:     { fontSize: 13, fontWeight: '700', color: C.brand },

  // Fee box
  feeBox: {
    backgroundColor: C.brandFaint, borderRadius: 14, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: C.border,
  },
  feeBoxTitle:    { fontSize: 12, fontWeight: '700', color: C.brand, letterSpacing: 0.8, marginBottom: 10, textTransform: 'uppercase' },
  feeRow:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  feeLabel:       { fontSize: 13, color: C.textSub },
  feeValue:       { fontSize: 13, color: C.textPrimary, fontWeight: '600' },
  feeDivider:     { height: 1, backgroundColor: C.border, marginVertical: 8 },
  feeTotalLabel:  { fontSize: 14, fontWeight: '800', color: C.textPrimary },
  feeTotalValue:  { fontSize: 14, fontWeight: '900' },
  insufficientRow:{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  insufficientText:{ fontSize: 12, color: C.red, fontWeight: '600' },

  // CTA
  ctaBtn: {
    backgroundColor: C.brand, borderRadius: 14, height: 54,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  ctaBtnDisabled: { backgroundColor: C.textMuted, shadowOpacity: 0, elevation: 0 },
  ctaBtnText:     { color: C.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  // Info card
  infoCard: {
    backgroundColor: C.surface, marginHorizontal: 16, marginTop: 16,
    borderRadius: 18, padding: 18,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  infoTitle: { fontSize: 13, fontWeight: '800', color: C.textPrimary, marginBottom: 14 },
  infoRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  infoIconBox: {
    width: 30, height: 30, borderRadius: 9, backgroundColor: C.brandFaint,
    alignItems: 'center', justifyContent: 'center',
  },
  infoText: { flex: 1, fontSize: 13, color: C.textSub, lineHeight: 19, paddingTop: 6 },

  // Paystack bar
  paystackBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  paystackClose: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  paystackTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  paystackLock:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  paystackLockText: { fontSize: 11, fontWeight: '700', color: C.green },
});

// ─── Bank picker modal styles ─────────────────────────────────────────────────
const bm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  title: { fontSize: 17, fontWeight: '800', color: C.textPrimary },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    margin: 16, marginBottom: 8,
    backgroundColor: C.bg, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1.5, borderColor: C.border,
  },
  searchInput:  { flex: 1, fontSize: 14, color: C.textPrimary },
  loadingBox:   { alignItems: 'center', paddingVertical: 32, gap: 8 },
  loadingText:  { fontSize: 13, color: C.textMuted },
  bankRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  bankIconBox: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: C.brandFaint,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  bankName: { flex: 1, fontSize: 14, fontWeight: '600', color: C.textPrimary },
});

// ─── Withdrawal success modal styles ─────────────────────────────────────────
const wm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 36, alignItems: 'center',
  },
  iconRing: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: C.greenFaint,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 20, marginBottom: 16,
    borderWidth: 3, borderColor: C.green,
  },
  iconInner: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: C.green,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '900', color: C.textPrimary, marginBottom: 8, letterSpacing: -0.3 },
  sub:   { fontSize: 14, color: C.textSub, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  summaryBox: {
    width: '100%', backgroundColor: C.bg, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: C.border, marginBottom: 24,
  },
  summaryRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  summaryLabel:   { fontSize: 13, color: C.textSub },
  summaryValue:   { fontSize: 13, color: C.textPrimary, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 12 },
  summaryDivider: { borderTopWidth: 1, borderTopColor: C.border, marginTop: 4, paddingTop: 10 },
  doneBtn: {
    width: '100%', height: 50, borderRadius: 12, backgroundColor: C.brand,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.brand, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  doneBtnText: { color: C.white, fontSize: 15, fontWeight: '800' },
});