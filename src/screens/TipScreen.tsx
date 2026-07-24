import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const { width: SW } = Dimensions.get('window');

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  brand:       '#6A0DAD',
  brandLight:  '#8B2BE2',
  brandFaint:  '#F3EAFF',
  brandMid:    'rgba(106,13,173,0.12)',
  brandDark:   '#4A0880',
  green:       '#22C55E',
  greenFaint:  '#F0FFF4',
  red:         '#EF4444',
  redFaint:    '#FEF2F2',
  gold:        '#F59E0B',
  bg:          '#F7F5FB',
  surface:     '#FFFFFF',
  border:      '#E8DFF5',
  overlay:     'rgba(15,5,35,0.55)',
  textPrimary: '#1A1035',
  textSub:     '#6B6480',
  textMuted:   '#A89FC0',
  white:       '#FFFFFF',
};

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

// ─── Types ────────────────────────────────────────────────────────────────────
type ConfirmPayload = {
  recipientName: string;
  tipAmount: number;
  platformFee: number;
  totalAmount: number;
  description: string;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Drag-handle pill for bottom-sheet modals */
const Handle = () => (
  <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
    <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: C.border }} />
  </View>
);

/** Confirmation modal — shown before actually sending */
const ConfirmModal: React.FC<{
  visible: boolean;
  payload: ConfirmPayload | null;
  onConfirm: () => void;
  onCancel: () => void;
  isSending: boolean;
  formatCurrency: (n: number) => string;
}> = ({ visible, payload, onConfirm, onCancel, isSending, formatCurrency }) => {
  if (!payload) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={ms.overlay}>
        <View style={ms.confirmSheet}>
          <Handle />

          {/* Icon */}
          <View style={ms.confirmIconRing}>
            <Ionicons name="paper-plane" size={28} color={C.brand} />
          </View>

          <Text style={ms.confirmTitle}>Confirm Tip</Text>
          <Text style={ms.confirmSub}>
            You're about to tip{' '}
            <Text style={{ color: C.brand, fontWeight: '800' }}>{payload.recipientName}</Text>
          </Text>

          {/* Amount highlight */}
          <View style={ms.confirmAmountBox}>
            <Text style={ms.confirmAmountLabel}>TIP AMOUNT</Text>
            <Text style={ms.confirmAmountValue}>{formatCurrency(payload.tipAmount)}</Text>
          </View>

          {/* Breakdown rows */}
          <View style={ms.confirmBreakdown}>
            <View style={ms.confirmRow}>
              <Text style={ms.confirmRowLabel}>Platform fee (5%)</Text>
              <Text style={ms.confirmRowValue}>{formatCurrency(payload.platformFee)}</Text>
            </View>
            <View style={ms.confirmDivider} />
            <View style={ms.confirmRow}>
              <Text style={[ms.confirmRowLabel, { fontWeight: '700', color: C.textPrimary }]}>
                Total deducted
              </Text>
              <Text style={[ms.confirmRowValue, { fontWeight: '800', color: C.brand }]}>
                {formatCurrency(payload.totalAmount)}
              </Text>
            </View>
          </View>

          {/* Note preview */}
          {payload.description ? (
            <View style={ms.confirmNoteBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={C.textMuted} />
              <Text style={ms.confirmNoteText} numberOfLines={2}>
                {payload.description}
              </Text>
            </View>
          ) : null}

          {/* Actions */}
          <View style={ms.confirmActions}>
            <TouchableOpacity style={ms.cancelBtn} onPress={onCancel} disabled={isSending}>
              <Text style={ms.cancelBtnText}>Go back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[ms.confirmBtn, isSending && { opacity: 0.7 }]}
              onPress={onConfirm}
              disabled={isSending}
            >
              {isSending ? (
                <ActivityIndicator color={C.white} size="small" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={16} color={C.white} />
                  <Text style={ms.confirmBtnText}>Send now</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/** Success modal — shown after tip lands */
const SuccessModal: React.FC<{
  visible: boolean;
  recipientName: string;
  tipAmount: number;
  platformFee: number;
  onSendAnother: () => void;
  onDone: () => void;
  formatCurrency: (n: number) => string;
}> = ({ visible, recipientName, tipAmount, platformFee, onSendAnother, onDone, formatCurrency }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onDone}>
    <View style={ms.overlay}>
      <View style={ms.successSheet}>
        <Handle />

        {/* Animated checkmark ring */}
        <View style={ms.successRing}>
          <View style={ms.successRingInner}>
            <Ionicons name="checkmark" size={36} color={C.white} />
          </View>
        </View>

        <Text style={ms.successTitle}>Tip Sent! 🎉</Text>
        <Text style={ms.successSub}>
          <Text style={{ fontWeight: '800', color: C.brand }}>{formatCurrency(tipAmount)}</Text>
          {' '}delivered to{' '}
          <Text style={{ fontWeight: '800', color: C.textPrimary }}>{recipientName}</Text>
        </Text>

        <View style={ms.successFeeRow}>
          <Ionicons name="information-circle-outline" size={14} color={C.textMuted} />
          <Text style={ms.successFeeText}>
            Platform fee: {formatCurrency(platformFee)}
          </Text>
        </View>

        <View style={ms.successActions}>
          <TouchableOpacity style={ms.anotherBtn} onPress={onSendAnother}>
            <Ionicons name="add-circle-outline" size={18} color={C.brand} />
            <Text style={ms.anotherBtnText}>Send Another</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ms.doneBtn} onPress={onDone}>
            <Text style={ms.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

/** Recents bottom-sheet modal */
const RecentsModal: React.FC<{
  visible: boolean;
  recentTips: any[];
  onSelect: (u: any) => void;
  onClose: () => void;
  formatCurrency: (n: number) => string;
}> = ({ visible, recentTips, onSelect, onClose, formatCurrency }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={ms.overlay}>
      <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      <View style={ms.recentsSheet}>
        <Handle />

        {/* Header */}
        <View style={ms.recentsHeader}>
          <View>
            <Text style={ms.recentsTitle}>Recent Tips</Text>
            <Text style={ms.recentsSub}>Tap a person to pre-fill recipient</Text>
          </View>
          <TouchableOpacity style={ms.recentsCloseBtn} onPress={onClose}>
            <Ionicons name="close" size={18} color={C.textSub} />
          </TouchableOpacity>
        </View>

        {recentTips.length === 0 ? (
          <View style={ms.recentsEmpty}>
            <View style={ms.recentsEmptyIcon}>
              <Ionicons name="people-outline" size={32} color={C.textMuted} />
            </View>
            <Text style={ms.recentsEmptyTitle}>No tips sent yet</Text>
            <Text style={ms.recentsEmptyText}>People you tip will show up here for quick access</Text>
          </View>
        ) : (
          <FlatList
            data={recentTips}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 360 }}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={ms.recentsItem}
                onPress={() => onSelect(item)}
                activeOpacity={0.75}
              >
                {/* Avatar */}
                <View style={ms.recentsAvatar}>
                  <Text style={ms.recentsAvatarText}>
                    {(item.recipientName || '?')[0].toUpperCase()}
                  </Text>
                </View>

                {/* Meta */}
                <View style={{ flex: 1 }}>
                  <Text style={ms.recentsName}>{item.recipientName}</Text>
                  <Text style={ms.recentsMeta}>
                    {item.recipientUsername
                      ? `@${item.recipientUsername}`
                      : item.recipientPhone || '—'}
                  </Text>
                </View>

                {/* Last amount */}
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={ms.recentsAmount}>{formatCurrency(item.amount)}</Text>
                  <View style={ms.recentsTag}>
                    <Text style={ms.recentsTagText}>Tap to select</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  </Modal>
);

// ─── Main screen ──────────────────────────────────────────────────────────────
export const TipScreen: React.FC = () => {
  const { balance, refreshBalance } = useWallet();
  const { user } = useAuth();

  const [recipientId, setRecipientId]               = useState('');
  const [recipientUserId, setRecipientUserId]       = useState('');
  const [recipientName, setRecipientName]           = useState('');
  const [amount, setAmount]                         = useState('');
  const [description, setDescription]               = useState('');
  const [isSubmitting, setIsSubmitting]             = useState(false);
  const [isValidating, setIsValidating]             = useState(false);
  const [recipientValidated, setRecipientValidated] = useState(false);
  const [searchResults, setSearchResults]           = useState<any[]>([]);
  const [showResults, setShowResults]               = useState(false);
  const [recentTips, setRecentTips]                 = useState<any[]>([]);

  // Modal states
  const [showRecentsModal, setShowRecentsModal]     = useState(false);
  const [showConfirmModal, setShowConfirmModal]     = useState(false);
  const [showSuccessModal, setShowSuccessModal]     = useState(false);
  const [successPayload, setSuccessPayload]         = useState({ name: '', tip: 0, fee: 0 });

  const tipAmount   = parseFloat(amount) || 0;
  const platformFee = tipAmount * 0.05;
  const totalAmount = tipAmount;
  const hasAmount   = tipAmount > 0;
  const canSend     =
    recipientValidated &&
    hasAmount &&
    totalAmount <= balance &&
    description.trim().length > 0 &&
    !isSubmitting;

  // ── Search debounce ──────────────────────────────────────────────────────
  React.useEffect(() => {
    const trimmed = recipientId.trim();
    if (!trimmed || trimmed.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      if (!trimmed) {
        setRecipientValidated(false);
        setRecipientName('');
        setRecipientUserId('');
      }
      return;
    }
    const timer = setTimeout(async () => {
      setIsValidating(true);
      try {
        const res = await apiService.searchUsersForTipping(trimmed);
        if (res.success && (res.data?.length ?? 0) > 0) {
          setSearchResults(res.data ?? []);
          setShowResults(true);
        } else {
          setSearchResults([]);
          setShowResults(false);
        }
      } catch {
        setSearchResults([]);
        setShowResults(false);
      } finally {
        setIsValidating(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [recipientId]);

  React.useEffect(() => { loadRecentTips(); }, []);

  const loadRecentTips = async () => {
    try {
      const res = await apiService.getTipsSent();
      if (res.success && Array.isArray(res.data?.tips)) {
        setRecentTips(res.data.tips.slice(0, 5));
      }
    } catch { /* silent */ }
  };

  const selectRecipient = (u: any) => {
    setRecipientId(u.username || u.phoneNumber || u.email || '');
    setRecipientUserId(u.id || u.username);
    setRecipientName(u.displayName || u.username);
    setRecipientValidated(true);
    setShowResults(false);
    setSearchResults([]);
  };

  const clearRecipient = () => {
    setRecipientId('');
    setRecipientUserId('');
    setRecipientName('');
    setRecipientValidated(false);
    setSearchResults([]);
    setShowResults(false);
  };

  const resetForm = () => {
    clearRecipient();
    setAmount('');
    setDescription('');
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n);

  const getTypeIcon = (type: string): any => {
    if (type === 'phone') return 'call-outline';
    if (type === 'referral') return 'gift-outline';
    return 'person-outline';
  };

  // Opens confirm modal instead of firing immediately
  const handlePressSend = () => {
    if (!canSend) return;
    setShowConfirmModal(true);
  };

  // Actually sends after confirmation
  const handleConfirmSend = async () => {
    try {
      setIsSubmitting(true);
      const res = await apiService.sendTip(recipientUserId, tipAmount, description.trim());
      if (res.success) {
        setSuccessPayload({ name: recipientName, tip: tipAmount, fee: platformFee });
        setShowConfirmModal(false);
        setShowSuccessModal(true);
        await refreshBalance();
        await loadRecentTips();
      } else {
        setShowConfirmModal(false);
        // small delay so confirm modal closes cleanly before error shows
        setTimeout(() => {
          // use inline state-driven error instead of Alert for better UX
          setApiError(res.error || 'Could not send tip. Please try again.');
        }, 300);
      }
    } catch (e: any) {
      setShowConfirmModal(false);
      setTimeout(() => setApiError(e?.message || 'Something went wrong.'), 300);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [apiError, setApiError] = useState('');

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Balance card */}
        <View style={s.balanceCard}>
          <Text style={s.balanceEyebrow}>WALLET BALANCE</Text>
          <Text style={s.balanceAmount}>{formatCurrency(balance)}</Text>
          <View style={s.balancePill}>
            <Ionicons name="shield-checkmark" size={12} color={C.green} />
            <Text style={s.balancePillText}>Secured by Givta</Text>
          </View>
        </View>

        {/* Form card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Send a Tip</Text>

          {/* API error banner */}
          {!!apiError && (
            <TouchableOpacity style={s.errorBanner} onPress={() => setApiError('')}>
              <Ionicons name="alert-circle" size={16} color={C.red} />
              <Text style={s.errorBannerText}>{apiError}</Text>
              <Ionicons name="close" size={14} color={C.red} />
            </TouchableOpacity>
          )}

          {/* ── Recipient ── */}
          <View style={s.fieldBlock}>
            <View style={s.fieldHeader}>
              <Text style={s.fieldLabel}>Recipient</Text>
              {recentTips.length > 0 && (
                <TouchableOpacity
                  style={s.recentBtn}
                  onPress={() => setShowRecentsModal(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="time-outline" size={13} color={C.brand} />
                  <Text style={s.recentBtnText}>Recents ({recentTips.length})</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[s.inputWrap, recipientValidated && s.inputWrapSuccess]}>
              <Ionicons
                name={recipientValidated ? 'person' : 'search-outline'}
                size={18}
                color={recipientValidated ? C.brand : C.textMuted}
                style={s.inputIcon}
              />
              <TextInput
                style={s.input}
                placeholder="@username or +2348012345678"
                placeholderTextColor={C.textMuted}
                value={recipientId}
                onChangeText={(t) => {
                  setRecipientId(t);
                  setApiError('');
                  if (recipientValidated) {
                    setRecipientValidated(false);
                    setRecipientName('');
                    setRecipientUserId('');
                  }
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {isValidating && (
                <ActivityIndicator size="small" color={C.brand} style={s.inputSuffix} />
              )}
              {recipientValidated && (
                <TouchableOpacity onPress={clearRecipient} style={s.inputSuffix}>
                  <Ionicons name="close-circle" size={20} color={C.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {recipientValidated && recipientName ? (
              <View style={s.validatedBadge}>
                <Ionicons name="checkmark-circle" size={15} color={C.green} />
                <Text style={s.validatedText}>{recipientName}</Text>
              </View>
            ) : recipientId.trim().length >= 2 && !isValidating && !recipientValidated && searchResults.length === 0 ? (
              <View style={s.errorBadge}>
                <Ionicons name="alert-circle-outline" size={15} color={C.red} />
                <Text style={s.errorBadgeText}>No user found for "{recipientId}"</Text>
              </View>
            ) : null}

            {/* Search dropdown */}
            {showResults && searchResults.length > 0 && (
              <View style={s.dropdown}>
                {searchResults.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={s.dropdownItem}
                    onPress={() => selectRecipient(item)}
                  >
                    <View style={s.dropdownAvatar}>
                      <Ionicons name={getTypeIcon(item.type)} size={16} color={C.brand} />
                    </View>
                    <View style={s.dropdownMeta}>
                      <Text style={s.dropdownName}>{item.displayName}</Text>
                      <Text style={s.dropdownSub}>
                        {[item.username && `@${item.username}`, item.phoneNumber]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* ── Amount ── */}
          <View style={s.fieldBlock}>
            <Text style={s.fieldLabel}>Amount (NGN)</Text>
            <View style={[s.inputWrap, hasAmount && s.inputWrapActive]}>
              <Text style={[s.currencySymbol, { color: hasAmount ? C.brand : C.textMuted }]}>₦</Text>
              <TextInput
                style={[s.input, s.amountInput]}
                placeholder="0.00 — how much to tip"
                placeholderTextColor={C.textMuted}
                value={amount}
                onChangeText={(v) => { setAmount(v); setApiError(''); }}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Quick-amount chips */}
          <View style={s.quickRow}>
            {QUICK_AMOUNTS.map((q) => (
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

          {/* ── Description ── */}
          <View style={s.fieldBlock}>
            <Text style={s.fieldLabel}>Note to recipient</Text>
            <View style={[s.inputWrap, s.inputWrapMulti, description.trim().length > 0 && s.inputWrapActive]}>
              <TextInput
                style={[s.input, s.descInput]}
                placeholder='e.g. "Great content, keep it up! 🔥"'
                placeholderTextColor={C.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={120}
              />
            </View>
            <Text style={s.fieldHint}>{description.trim().length}/120</Text>
          </View>

          {/* Fee box */}
          {hasAmount && (
            <View style={s.feeBox}>
              <View style={s.feeRow}>
                <Text style={s.feeLabel}>Tip amount</Text>
                <Text style={s.feeValue}>{formatCurrency(tipAmount)}</Text>
              </View>
              <View style={s.feeRow}>
                <Text style={s.feeLabel}>Platform fee (5%)</Text>
                <Text style={s.feeValue}>{formatCurrency(platformFee)}</Text>
              </View>
              <View style={s.feeDivider} />
              <View style={s.feeRow}>
                <Text style={s.feeTotalLabel}>Total deducted</Text>
                <Text style={[s.feeTotalValue, totalAmount > balance && { color: C.red }]}>
                  {formatCurrency(totalAmount)}
                </Text>
              </View>
              {totalAmount > balance && (
                <View style={s.insufficientBanner}>
                  <Ionicons name="warning-outline" size={14} color={C.red} />
                  <Text style={s.insufficientText}>Balance too low — fund your wallet first</Text>
                </View>
              )}
            </View>
          )}

          {/* Send button */}
          <TouchableOpacity
            style={[s.sendBtn, !canSend && s.sendBtnDisabled]}
            onPress={handlePressSend}
            disabled={!canSend}
            activeOpacity={0.85}
          >
            <Ionicons name="paper-plane" size={18} color={C.white} style={{ marginRight: 8 }} />
            <Text style={s.sendBtnText}>
              {hasAmount ? `Send ${formatCurrency(tipAmount)}` : 'Send Tip'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Modals ───────────────────────────────────────────────────────── */}

      <RecentsModal
        visible={showRecentsModal}
        recentTips={recentTips}
        formatCurrency={formatCurrency}
        onSelect={(item) => {
          selectRecipient({
            id: item.recipientId,
            username: item.recipientUsername,
            displayName: item.recipientName,
            phoneNumber: item.recipientPhone,
            email: item.recipientEmail,
            type: item.recipientType || 'username',
          });
          setShowRecentsModal(false);
        }}
        onClose={() => setShowRecentsModal(false)}
      />

      <ConfirmModal
        visible={showConfirmModal}
        payload={
          showConfirmModal
            ? { recipientName, tipAmount, platformFee, totalAmount, description }
            : null
        }
        onConfirm={handleConfirmSend}
        onCancel={() => setShowConfirmModal(false)}
        isSending={isSubmitting}
        formatCurrency={formatCurrency}
      />

      <SuccessModal
        visible={showSuccessModal}
        recipientName={successPayload.name}
        tipAmount={successPayload.tip}
        platformFee={successPayload.fee}
        formatCurrency={formatCurrency}
        onSendAnother={() => { setShowSuccessModal(false); resetForm(); }}
        onDone={() => setShowSuccessModal(false)}
      />
    </View>
  );
};

// ─── Main screen styles ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 40 },

  // Balance
  balanceCard: {
    backgroundColor: C.brand,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  balanceEyebrow: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  balanceAmount: {
    color: C.white,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  balancePillText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
  },

  // Card
  card: {
    backgroundColor: C.surface,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    padding: 22,
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.textPrimary,
    marginBottom: 22,
    letterSpacing: -0.3,
  },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.redFaint,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    color: C.red,
    fontSize: 13,
    fontWeight: '500',
  },

  // Fields
  fieldBlock:  { marginBottom: 18 },
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  fieldLabel:  { fontSize: 13, fontWeight: '700', color: C.textPrimary, letterSpacing: 0.2 },
  fieldHint:   { fontSize: 11, color: C.textMuted, marginTop: 5, textAlign: 'right' },

  // Inputs
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    minHeight: 52,
    paddingHorizontal: 14,
  },
  inputWrapActive:  { borderColor: C.brand, backgroundColor: C.brandFaint },
  inputWrapSuccess: { borderColor: C.green, backgroundColor: C.greenFaint },
  inputWrapMulti:   { alignItems: 'flex-start', paddingVertical: 12 },
  inputIcon:    { marginRight: 10 },
  inputSuffix:  { marginLeft: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    color: C.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? 4 : 0,
  },
  amountInput: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  descInput:   { minHeight: 72, lineHeight: 22 },
  currencySymbol: { fontSize: 20, fontWeight: '700', marginRight: 6 },

  // Badges
  validatedBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 7, gap: 5 },
  validatedText:  { color: C.green, fontSize: 13, fontWeight: '600' },
  errorBadge:     { flexDirection: 'row', alignItems: 'center', marginTop: 7, gap: 5 },
  errorBadgeText: { color: C.red, fontSize: 13, fontWeight: '500' },

  // Search dropdown
  dropdown: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    marginTop: 6,
    backgroundColor: C.surface,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0FC',
  },
  dropdownAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: C.brandFaint,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  dropdownMeta: { flex: 1 },
  dropdownName: { fontSize: 15, fontWeight: '600', color: C.textPrimary },
  dropdownSub:  { fontSize: 12, color: C.textMuted, marginTop: 2 },

  // Recents button
  recentBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.brandMid,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, gap: 4,
  },
  recentBtnText: { color: C.brand, fontSize: 12, fontWeight: '600' },

  // Quick chips
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -6, marginBottom: 18 },
  quickChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: C.border, backgroundColor: C.surface,
  },
  quickChipActive:     { borderColor: C.brand, backgroundColor: C.brandFaint },
  quickChipText:       { fontSize: 13, fontWeight: '600', color: C.textSub },
  quickChipTextActive: { color: C.brand },

  // Fee box
  feeBox:           { backgroundColor: C.brandFaint, borderRadius: 14, padding: 16, marginBottom: 20 },
  feeRow:           { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  feeLabel:         { fontSize: 13, color: C.textSub },
  feeValue:         { fontSize: 13, color: C.textPrimary, fontWeight: '500' },
  feeDivider:       { height: 1, backgroundColor: C.border, marginVertical: 8 },
  feeTotalLabel:    { fontSize: 14, fontWeight: '700', color: C.textPrimary },
  feeTotalValue:    { fontSize: 14, fontWeight: '800', color: C.brand },
  insufficientBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 8, backgroundColor: C.redFaint,
    borderRadius: 8, padding: 8,
  },
  insufficientText: { color: C.red, fontSize: 12, fontWeight: '500', flex: 1 },

  // Send button
  sendBtn: {
    backgroundColor: C.brand, borderRadius: 14, height: 54,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  sendBtnDisabled: { backgroundColor: C.textMuted, shadowOpacity: 0, elevation: 0 },
  sendBtnText:     { color: C.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
});

// ─── Modal styles ─────────────────────────────────────────────────────────────
const ms = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: C.overlay,
    justifyContent: 'flex-end',
  },

  // ── Confirm modal ──
  confirmSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  confirmIconRing: {
    alignSelf: 'center',
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: C.brandFaint,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 16, marginBottom: 16,
    borderWidth: 2, borderColor: C.border,
  },
  confirmTitle: {
    fontSize: 22, fontWeight: '800',
    color: C.textPrimary, textAlign: 'center',
    letterSpacing: -0.3, marginBottom: 6,
  },
  confirmSub: {
    fontSize: 14, color: C.textSub,
    textAlign: 'center', marginBottom: 20,
    lineHeight: 20,
  },
  confirmAmountBox: {
    alignItems: 'center',
    backgroundColor: C.brandFaint,
    borderRadius: 16, padding: 18,
    marginBottom: 16,
  },
  confirmAmountLabel: {
    fontSize: 10, fontWeight: '700',
    color: C.brand, letterSpacing: 1.2,
    marginBottom: 4,
  },
  confirmAmountValue: {
    fontSize: 34, fontWeight: '900',
    color: C.brand, letterSpacing: -0.5,
  },
  confirmBreakdown: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12, padding: 14,
    marginBottom: 14,
    borderWidth: 1, borderColor: C.border,
  },
  confirmRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  confirmRowLabel: { fontSize: 13, color: C.textSub },
  confirmRowValue: { fontSize: 13, color: C.textPrimary, fontWeight: '600' },
  confirmDivider:  { height: 1, backgroundColor: C.border, marginVertical: 6 },
  confirmNoteBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 8, backgroundColor: C.bg,
    borderRadius: 10, padding: 12,
    marginBottom: 20, borderWidth: 1, borderColor: C.border,
  },
  confirmNoteText: { flex: 1, fontSize: 13, color: C.textSub, lineHeight: 18, fontStyle: 'italic' },
  confirmActions:  { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, height: 50, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: C.textSub },
  confirmBtn: {
    flex: 2, height: 50, borderRadius: 12,
    backgroundColor: C.brand,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  confirmBtnText: { fontSize: 15, fontWeight: '800', color: C.white },

  // ── Success modal ──
  successSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 36,
    alignItems: 'center',
  },
  successRing: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: C.greenFaint,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 20, marginBottom: 18,
    borderWidth: 3, borderColor: C.green,
  },
  successRingInner: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: C.green,
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle: {
    fontSize: 26, fontWeight: '900',
    color: C.textPrimary, marginBottom: 8,
    letterSpacing: -0.4,
  },
  successSub: {
    fontSize: 15, color: C.textSub,
    textAlign: 'center', lineHeight: 22,
    marginBottom: 14,
  },
  successFeeRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, marginBottom: 28,
  },
  successFeeText: { fontSize: 12, color: C.textMuted },
  successActions: { flexDirection: 'row', gap: 12, width: '100%' },
  anotherBtn: {
    flex: 1, height: 50, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.brand,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: C.brandFaint,
  },
  anotherBtnText: { fontSize: 14, fontWeight: '700', color: C.brand },
  doneBtn: {
    flex: 1, height: 50, borderRadius: 12,
    backgroundColor: C.brand,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  doneBtnText: { fontSize: 15, fontWeight: '800', color: C.white },

  // ── Recents modal ──
  recentsSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '75%',
  },
  recentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom: 16,
  },
  recentsTitle:    { fontSize: 18, fontWeight: '800', color: C.textPrimary, letterSpacing: -0.2 },
  recentsSub:      { fontSize: 12, color: C.textMuted, marginTop: 3 },
  recentsCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  recentsEmpty: { alignItems: 'center', paddingVertical: 44, paddingHorizontal: 24 },
  recentsEmptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  recentsEmptyTitle: { fontSize: 16, fontWeight: '700', color: C.textSub, marginBottom: 6 },
  recentsEmptyText:  { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 19 },
  recentsItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  recentsAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: C.brandFaint,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
    borderWidth: 2, borderColor: C.border,
  },
  recentsAvatarText: { fontSize: 20, fontWeight: '800', color: C.brand },
  recentsName:       { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  recentsMeta:       { fontSize: 13, color: C.textMuted, marginTop: 2 },
  recentsAmount:     { fontSize: 14, fontWeight: '700', color: C.green },
  recentsTag: {
    backgroundColor: C.brandMid,
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  recentsTagText: { fontSize: 10, fontWeight: '600', color: C.brand },
});