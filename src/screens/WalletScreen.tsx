import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList, RefreshControl,
  Alert, Share, TouchableOpacity, Linking, Modal, SafeAreaView,
  TextInput, ActivityIndicator, Platform, Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import { transactionCollection } from '../collections/transactions';
import { userCollection } from '../collections/users';
import { notificationCollection } from '../collections/notifications';
import { applicationNotificationsCollection, ApplicationNotification } from '../collections/applicationNotifications';
import { config } from '../config';

const { width: SW } = Dimensions.get('window');

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  brand:      '#6A0DAD',
  brandDark:  '#4A0880',
  brandLight: '#8B2BE2',
  brandFaint: '#F3EAFF',
  brandMid:   'rgba(106,13,173,0.12)',
  green:      '#22C55E',
  greenFaint: '#F0FFF4',
  red:        '#EF4444',
  redFaint:   '#FEF2F2',
  amber:      '#F59E0B',
  amberFaint: '#FFFBEB',
  blue:       '#3B82F6',
  blueFaint:  '#EFF6FF',
  bg:         '#F7F5FB',
  surface:    '#FFFFFF',
  border:     '#E8DFF5',
  overlay:    'rgba(15,5,35,0.6)',
  textPrimary:'#1A1035',
  textSub:    '#6B6480',
  textMuted:  '#A89FC0',
  white:      '#FFFFFF',
};

// ─── Drag handle ──────────────────────────────────────────────────────────────
const Handle = () => (
  <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 2 }}>
    <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C.border }} />
  </View>
);

// ─── Notification type helpers ────────────────────────────────────────────────
const notifMeta = (type: string) => {
  switch (type) {
    case 'promo':   return { icon: 'gift',               color: C.amber,  bg: C.amberFaint };
    case 'warning': return { icon: 'warning',            color: C.red,    bg: C.redFaint   };
    case 'success': return { icon: 'checkmark-circle',   color: C.green,  bg: C.greenFaint };
    case 'info':    return { icon: 'information-circle', color: C.blue,   bg: C.blueFaint  };
    default:        return { icon: 'megaphone',          color: C.brand,  bg: C.brandFaint };
  }
};

// ─── Transaction Detail Modal ─────────────────────────────────────────────────
const TxDetailModal: React.FC<{
  visible: boolean;
  txn: any;
  onClose: () => void;
  fmt: (n: number) => string;
  fmtDate: (d: any) => string;
}> = ({ visible, txn, onClose, fmt, fmtDate }) => {
  if (!txn) return null;
  const isDebit = txn.type === 'withdrawal' || txn.type === 'tip_sent';
  const typeLabel: Record<string, string> = {
    deposit: 'Deposit', withdrawal: 'Withdrawal',
    tip_sent: 'Tip Sent', tip_received: 'Tip Received',
    referral_bonus: 'Referral Bonus', tip: 'Tip',
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={ms.overlay}>
        <View style={ms.txSheet}>
          <Handle />
          {/* Icon + type */}
          <View style={ms.txIconWrap}>
            <TxIcon type={txn.type} size={30} />
          </View>
          <Text style={ms.txTitle}>{typeLabel[txn.type] || 'Transaction'}</Text>

          {/* Big amount */}
          <View style={[ms.txAmountBox, { backgroundColor: isDebit ? C.redFaint : C.greenFaint }]}>
            <Text style={[ms.txAmountEyebrow, { color: isDebit ? C.red : C.green }]}>AMOUNT</Text>
            <Text style={[ms.txAmountValue, { color: isDebit ? C.red : C.green }]}>
              {isDebit ? '−' : '+'}{fmt(Math.abs(txn.amount))}
            </Text>
          </View>

          {/* Detail rows */}
          <View style={ms.txRows}>
            {[
              { label: 'Status',         value: txn.status?.toUpperCase(), accent: txn.status === 'completed' ? C.green : txn.status === 'pending' ? C.amber : C.red },
              { label: 'Date',           value: fmtDate(txn.createdAt) },
              { label: 'Transaction ID', value: txn.id, mono: true },
              txn.description && { label: 'Description', value: txn.resolvedDescription || txn.description },
              txn.reference  && { label: 'Reference',   value: txn.reference, mono: true },
            ].filter(Boolean).map((row: any, i) => (
              <View key={i} style={ms.txRow}>
                <Text style={ms.txRowLabel}>{row.label}</Text>
                <Text style={[ms.txRowValue, row.mono && { fontFamily: 'monospace', fontSize: 11 }, row.accent && { color: row.accent, fontWeight: '700' }]}
                  numberOfLines={2}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={ms.txCloseBtn} onPress={onClose}>
            <Text style={ms.txCloseBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── All Transactions Modal ───────────────────────────────────────────────────
const AllTxModal: React.FC<{
  visible: boolean;
  data: any[];
  loading: boolean;
  onClose: () => void;
  onPressTx: (t: any) => void;
  fmt: (n: number) => string;
  fmtDate: (d: any) => string;
}> = ({ visible, data, loading, onClose, onPressTx, fmt, fmtDate }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = data.filter(t => {
    const matchSearch = !search ||
      (t.resolvedDescription || t.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.type || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || t.type === filter || (filter === 'tip' && (t.type === 'tip_sent' || t.type === 'tip_received'));
    return matchSearch && matchFilter;
  });

  const FILTERS = [
    { key: 'all',      label: 'All',        icon: 'list-outline' },
    { key: 'deposit',  label: 'Deposits',   icon: 'arrow-down-circle-outline' },
    { key: 'withdrawal',label: 'Cash Outs', icon: 'arrow-up-circle-outline' },
    { key: 'tip',      label: 'Tips',       icon: 'gift-outline' },
    { key: 'referral_bonus', label: 'Referrals', icon: 'people-outline' },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={ms.fullRoot}>
        {/* Header */}
        <View style={ms.fullHeader}>
          <TouchableOpacity style={ms.fullBack} onPress={onClose}>
            <Ionicons name="arrow-back" size={20} color={C.white} />
          </TouchableOpacity>
          <Text style={ms.fullTitle}>All Transactions</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={ms.fullBody}>
          {/* Search */}
          <View style={ms.searchWrap}>
            <Ionicons name="search-outline" size={16} color={C.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={ms.searchInput}
              placeholder="Search by description or type…"
              placeholderTextColor={C.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            {!!search && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={C.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ms.filterScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f.key}
                style={[ms.filterChip, filter === f.key && ms.filterChipActive]}
                onPress={() => setFilter(f.key)}
              >
                <Ionicons name={f.icon as any} size={13} color={filter === f.key ? C.white : C.brand} />
                <Text style={[ms.filterChipText, filter === f.key && ms.filterChipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* List */}
          {loading ? (
            <View style={ms.loadingBox}>
              <ActivityIndicator color={C.brand} />
              <Text style={ms.loadingText}>Loading transactions…</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={i => i.id}
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              ListEmptyComponent={
                <View style={ms.emptyBox}>
                  <Ionicons name="document-text-outline" size={44} color={C.textMuted} />
                  <Text style={ms.emptyTitle}>No transactions found</Text>
                  <Text style={ms.emptySub}>Try a different search or filter</Text>
                </View>
              }
              renderItem={({ item }) => (
                <TouchableOpacity style={ms.txItem} onPress={() => onPressTx(item)} activeOpacity={0.75}>
                  <View style={ms.txItemLeft}>
                    <View style={ms.txItemIcon}>
                      <TxIcon type={item.type} size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={ms.txItemDesc} numberOfLines={1}>
                        {item.resolvedDescription || item.description}
                      </Text>
                      <Text style={ms.txItemDate}>{fmtDate(item.createdAt)}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[ms.txItemAmt, (item.type === 'withdrawal' || item.type === 'tip_sent') ? { color: C.red } : { color: C.green }]}>
                      {(item.type === 'withdrawal' || item.type === 'tip_sent') ? '−' : '+'}{fmt(Math.abs(item.amount))}
                    </Text>
                    <View style={[ms.txStatusPill, item.status === 'completed' ? ms.statusCompleted : item.status === 'pending' ? ms.statusPending : ms.statusFailed]}>
                      <Text style={ms.txStatusText}>{item.status}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// ─── Tipping Link Modal ───────────────────────────────────────────────────────
const TippingLinkModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  tippingLink: string;
  user: any;
  onCopy: () => void;
  onShare: () => void;
}> = ({ visible, onClose, tippingLink, user, onCopy, onShare }) => (
  <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <SafeAreaView style={ms.fullRoot}>
      <View style={ms.fullHeader}>
        <TouchableOpacity style={ms.fullBack} onPress={onClose}>
          <Ionicons name="close" size={20} color={C.white} />
        </TouchableOpacity>
        <Text style={ms.fullTitle}>Your Tipping Link</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={ms.fullBody} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Username badge */}
        <View style={ms.tipUserBadge}>
          <View style={ms.tipAvatarRing}>
            <Text style={ms.tipAvatarText}>
              {(user?.username || user?.email || '?')[0].toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={ms.tipUsername}>
              @{user?.username || user?.email?.split('@')[0] || 'you'}
            </Text>
            <View style={ms.tipVerifiedRow}>
              <Ionicons name="shield-checkmark" size={12} color={C.green} />
              <Text style={ms.tipVerifiedText}>Verified Givta creator</Text>
            </View>
          </View>
        </View>

        {/* Link box */}
        <View style={ms.tipLinkBox}>
          <Text style={ms.tipLinkEyebrow}>YOUR TIPPING LINK</Text>
          <Text style={ms.tipLinkText} numberOfLines={2}>{tippingLink || 'Generating…'}</Text>
        </View>

        {/* Actions */}
        <View style={ms.tipActions}>
          <TouchableOpacity style={ms.tipCopyBtn} onPress={onCopy}>
            <Ionicons name="copy-outline" size={18} color={C.brand} />
            <Text style={ms.tipCopyText}>Copy link</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ms.tipShareBtn} onPress={onShare}>
            <Ionicons name="share-social" size={18} color={C.white} />
            <Text style={ms.tipShareText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* How it works */}
        <View style={ms.tipHowBox}>
          <Text style={ms.tipHowTitle}>How it works</Text>
          {[
            { icon: 'share-outline',    text: 'Add the link to your bio or posts' },
            { icon: 'people-outline',   text: 'Fans click it from any platform — no app needed' },
            { icon: 'wallet-outline',   text: 'Tips land in your Givta wallet instantly' },
            { icon: 'cash-outline',     text: 'Cash out anytime via bank or mobile money' },
          ].map((item, i) => (
            <View key={i} style={ms.tipHowRow}>
              <View style={ms.tipHowIcon}>
                <Ionicons name={item.icon as any} size={16} color={C.brand} />
              </View>
              <Text style={ms.tipHowText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={ms.tipCloseBtn} onPress={onClose}>
          <Text style={ms.tipCloseBtnText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  </Modal>
);

// ─── Earn More Modal ──────────────────────────────────────────────────────────
const EarnMoreModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onGoToTippingLink: () => void;
}> = ({ visible, onClose, onGoToTippingLink }) => {
  const sections = [
    {
      icon: 'rocket-outline', title: 'How Givta works',
      body: 'Givta connects creators with fans across every platform. Fans tip you instantly through a link — no app required. Tips hit your wallet right away.',
    },
    {
      icon: 'megaphone-outline', title: 'Where to share your link',
      items: ['Instagram & TikTok bio', 'Twitter/X pinned tweet', 'YouTube & video descriptions', 'Live stream chat & panels', 'WhatsApp status & groups', 'Discord server pinned message'],
    },
    {
      icon: 'trending-up-outline', title: 'Grow your earnings',
      items: ['Post consistently — more content = more tips', 'Thank tippers publicly to encourage others', 'Set creator goals so fans know what they\'re funding', 'Refer friends to earn referral bonuses'],
    },
    {
      icon: 'cash-outline', title: 'Getting paid',
      body: 'Withdraw anytime via Nigerian bank transfer or mobile money. No minimum threshold — your money, your schedule.',
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={ms.fullRoot}>
        <View style={ms.fullHeader}>
          <TouchableOpacity style={ms.fullBack} onPress={onClose}>
            <Ionicons name="close" size={20} color={C.white} />
          </TouchableOpacity>
          <Text style={ms.fullTitle}>Earn More</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView style={ms.fullBody} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {/* Hero */}
          <View style={ms.earnHero}>
            <Text style={ms.earnHeroEmoji}>💰</Text>
            <Text style={ms.earnHeroTitle}>More tips start with sharing</Text>
            <Text style={ms.earnHeroSub}>
              Every place you drop your link is another chance to earn. Here's how to do it right.
            </Text>
          </View>

          {sections.map((sec, i) => (
            <View key={i} style={ms.earnSection}>
              <View style={ms.earnSectionHeader}>
                <View style={ms.earnSectionIcon}>
                  <Ionicons name={sec.icon as any} size={18} color={C.brand} />
                </View>
                <Text style={ms.earnSectionTitle}>{sec.title}</Text>
              </View>
              {sec.body && <Text style={ms.earnSectionBody}>{sec.body}</Text>}
              {sec.items && sec.items.map((it, j) => (
                <View key={j} style={ms.earnBullet}>
                  <View style={ms.earnBulletDot} />
                  <Text style={ms.earnBulletText}>{it}</Text>
                </View>
              ))}
            </View>
          ))}

          {/* WhatsApp bot */}
          <TouchableOpacity
            style={ms.whatsappBtn}
            onPress={() => Linking.openURL('https://wa.me/234XXXXXXXXXX').catch(() =>
              Alert.alert('Coming soon', 'WhatsApp bot integration is coming soon!'))}
          >
            <Ionicons name="logo-whatsapp" size={20} color={C.white} />
            <Text style={ms.whatsappBtnText}>Chat with our WhatsApp bot</Text>
          </TouchableOpacity>

          {/* CTA */}
          <TouchableOpacity style={ms.earnCTA} onPress={() => { onClose(); onGoToTippingLink(); }}>
            <Ionicons name="link-outline" size={18} color={C.white} />
            <Text style={ms.earnCTAText}>Get my tipping link</Text>
          </TouchableOpacity>

          <TouchableOpacity style={ms.earnClosePlain} onPress={onClose}>
            <Text style={ms.earnClosePlainText}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ─── Error Modal ──────────────────────────────────────────────────────────────
const ErrorModal: React.FC<{
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}> = ({ visible, title, message, onClose }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={ms.overlay}>
      <View style={ms.errSheet}>
        <Handle />
        <View style={ms.errIconRing}>
          <Ionicons name="warning" size={28} color={C.red} />
        </View>
        <Text style={ms.errTitle}>{title}</Text>
        <Text style={ms.errBody}>{message}</Text>
        <TouchableOpacity style={ms.errBtn} onPress={onClose}>
          <Text style={ms.errBtnText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// ─── TxIcon helper ────────────────────────────────────────────────────────────
const TxIcon: React.FC<{ type: string; size?: number }> = ({ type, size = 22 }) => {
  const map: Record<string, [any, string]> = {
    deposit:        ['arrow-down-circle', C.green],
    withdrawal:     ['arrow-up-circle',   C.red],
    tip:            ['gift',              C.amber],
    tip_sent:       ['gift',              C.amber],
    tip_received:   ['gift',              C.brand],
    referral_bonus: ['people',            C.brand],
  };
  const [name, color] = map[type] || ['card-outline', C.textMuted];
  return <Ionicons name={name} size={size} color={color} />;
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const WalletScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { balance, transactions, loading, refreshBalance, refreshTransactions } = useWallet();

  const [refreshing, setRefreshing]   = useState(false);
  const [tippingLink, setTippingLink] = useState('');
  const [unreadNotifications, setUnreadNotifications]   = useState(0);
  const [deviceRegistered, setDeviceRegistered]         = useState<string | null>(null);
  const [allTransactions, setAllTransactions]           = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions]   = useState(false);
  const [transactionStats, setTransactionStats]         = useState({
    totalDeposits: 0, totalWithdrawals: 0, totalTips: 0,
    totalReferrals: 0, thisMonthDeposits: 0, thisMonthWithdrawals: 0,
  });
  const [selectedTx, setSelectedTx]                         = useState<any>(null);
  const [txDetailVisible, setTxDetailVisible]               = useState(false);
  const [allTxVisible, setAllTxVisible]                     = useState(false);
  const [tippingModalVisible, setTippingModalVisible]       = useState(false);
  const [earnMoreVisible, setEarnMoreVisible]               = useState(false);
  const [errorModalVisible, setErrorModalVisible]           = useState(false);
  const [errorTitle, setErrorTitle]                         = useState('');
  const [errorMessage, setErrorMessage]                     = useState('');
  const [applicationNotifications, setApplicationNotifications] = useState<ApplicationNotification[]>([]);
  const [currentNotifIndex, setCurrentNotifIndex]           = useState(0);
  const notifScrollRef = useRef<ScrollView>(null);

  // ── Tipping link ────────────────────────────────────────────────────────
  const generateTippingLink = async () => {
    if (!user?.id) return '';
    const username = user.username || user.email?.split('@')[0] || user.id;
    return `https://givta.com.ng/tip/${username}`;
  };

  useEffect(() => {
    generateTippingLink().then(setTippingLink);
  }, [user]);

  const shareTippingLink = async () => {
    const link = await generateTippingLink();
    if (!link) return Alert.alert('Error', 'Unable to generate tipping link');
    const name = user?.username || user?.email?.split('@')[0] || 'Givta User';
    try {
      await Share.share({
        message: `🎁 Support ${name} with a tip 💰\n\n${link}\n\n#Givta`,
        url: link,
      });
    } catch { Alert.alert('Error', 'Failed to share. Try again.'); }
  };

  const copyTippingLink = async () => {
    const link = await generateTippingLink();
    if (!link) return Alert.alert('Error', 'Unable to generate tipping link');
    await Clipboard.setStringAsync(link);
    Alert.alert('Copied!', 'Tipping link copied to clipboard.');
  };

  // ── Notifications ───────────────────────────────────────────────────────
  useEffect(() => { if (user?.id) loadUnreadCount(); }, [user]);

  useEffect(() => {
    AsyncStorage.getItem('deviceRegistered').then(setDeviceRegistered).catch(() => null);
  }, []);

  const loadUnreadCount = async () => {
    if (!user?.id) return;
    try { setUnreadNotifications(await notificationCollection.getUnreadCount(user.id)); }
    catch { /* silent */ }
  };

  // ── App notifications ───────────────────────────────────────────────────
  useEffect(() => { if (user?.id) loadAppNotifications(); }, [user]);

  useEffect(() => {
    if (applicationNotifications.length <= 1) return;
    const iv = setInterval(() =>
      setCurrentNotifIndex(i => (i + 1) % applicationNotifications.length), 5000);
    return () => clearInterval(iv);
  }, [applicationNotifications.length]);

  useEffect(() => {
    if (notifScrollRef.current && applicationNotifications.length > 1) {
      notifScrollRef.current.scrollTo({ x: currentNotifIndex * SW, animated: true });
    }
  }, [currentNotifIndex]);

  const loadAppNotifications = async () => {
    if (!user?.id) return;
    try {
      const notifs = await applicationNotificationsCollection.getAllActive('all');
      setApplicationNotifications(notifs);
    } catch { /* silent */ }
  };

  // ── Transactions ────────────────────────────────────────────────────────
  useEffect(() => { loadAllTransactions(); }, []);

  const loadAllTransactions = async () => {
    if (!user?.id) return;
    setLoadingTransactions(true);
    try {
      const result = await transactionCollection.getByUserId(user.id, 50);
      if (!result || !Array.isArray(result.transactions)) {
        setAllTransactions([]);
        calculateStats([]);
        return;
      }
      const resolved = await Promise.all(
        result.transactions.map(async (txn: any) => {
          try {
            if (txn.type === 'tip_sent' && txn.recipientId) {
              const r = await userCollection.getById(txn.recipientId);
              txn.resolvedDescription = r ? `Tip to @${r.username || r.email?.split('@')[0]}` : txn.description;
            } else if (txn.type === 'tip_received' && txn.senderId) {
              const s = await userCollection.getById(txn.senderId);
              txn.resolvedDescription = s ? `Tip from @${s.username || s.email?.split('@')[0]}` : txn.description;
            } else {
              txn.resolvedDescription = txn.description;
            }
          } catch { txn.resolvedDescription = txn.description; }
          return txn;
        })
      );
      setAllTransactions(resolved);
      calculateStats(result.transactions);
    } catch (e) {
      setAllTransactions([]);
      calculateStats([]);
      setErrorTitle('Could not load transactions');
      setErrorMessage('Pull down to refresh and try again.');
      setErrorModalVisible(true);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const calculateStats = (txns: any[]) => {
    const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const s = txns.reduce((acc, t) => {
      const amt = Math.abs(t.amount || 0);
      const d = t.createdAt ? new Date(t.createdAt) : new Date();
      switch (t.type) {
        case 'deposit':        acc.totalDeposits += amt; if (d >= thisMonth) acc.thisMonthDeposits += amt; break;
        case 'withdrawal':     acc.totalWithdrawals += amt; if (d >= thisMonth) acc.thisMonthWithdrawals += amt; break;
        case 'tip_sent':       acc.totalTips += amt; break;
        case 'referral_bonus': acc.totalReferrals += amt; break;
      }
      return acc;
    }, { totalDeposits: 0, totalWithdrawals: 0, totalTips: 0, totalReferrals: 0, thisMonthDeposits: 0, thisMonthWithdrawals: 0 });
    setTransactionStats(s);
  };

  // ── Pull to refresh ─────────────────────────────────────────────────────
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadUnreadCount(), loadAppNotifications(),
      refreshBalance(), refreshTransactions(), loadAllTransactions(),
    ]);
    setRefreshing(false);
  };

  // ── Formatters ──────────────────────────────────────────────────────────
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n);

  const fmtDate = (date: any) => {
    try {
      if (!date) return 'N/A';
      let d: Date;
      if (date?.toDate) d = date.toDate();
      else if (date?.seconds) d = new Date(date.seconds * 1000);
      else d = new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
      return new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d);
    } catch { return 'N/A'; }
  };

  const QUICK_ACTIONS = [
    { id: 'deposit',  label: 'Deposit',   icon: 'add-circle',    color: C.green,  action: () => (navigation as any).navigate('Payment', { paymentType: 'deposit' }) },
    { id: 'withdraw', label: 'Withdraw',  icon: 'remove-circle', color: C.red,    action: () => (navigation as any).navigate('Payment', { paymentType: 'withdraw' }) },
    { id: 'tip',      label: 'Send Tip',  icon: 'gift',          color: C.amber,  action: () => (navigation as any).navigate('Tip') },
    { id: 'share',    label: 'Share Link',icon: 'share-social',  color: C.brand,  action: () => setTippingModalVisible(true) },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root}>
      {/* ── Top bar ── */}
      <View style={s.topBar}>
        <Text style={s.logo}>Givta</Text>
        <View style={s.topRight}>
          <TouchableOpacity style={s.earnBtn} onPress={() => setEarnMoreVisible(true)}>
            <Ionicons name="bulb-outline" size={15} color={C.white} />
            <Text style={s.earnBtnText}>Earn More</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.notifBtn} onPress={() => (navigation as any).navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={22} color={C.white} />
            {unreadNotifications > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{unreadNotifications > 99 ? '99+' : unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={s.deviceDotWrap}>
            <View style={[s.deviceDot, deviceRegistered === 'true' ? s.deviceDotOn : s.deviceDotOff]} />
          </View>
        </View>
      </View>

      {/* ── Scrollable body ── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance hero */}
        <View style={s.hero}>
          <Text style={s.heroEyebrow}>CURRENT BALANCE</Text>
          <Text style={s.heroAmount}>{fmt(balance)}</Text>
          <TouchableOpacity style={s.heroRefresh} onPress={onRefresh}>
            <Ionicons name="refresh" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={s.heroRefreshText}>Refresh</Text>
          </TouchableOpacity>

          {/* Quick actions */}
          <View style={s.qaRow}>
            {QUICK_ACTIONS.map(a => (
              <TouchableOpacity key={a.id} style={s.qaBtn} onPress={a.action} activeOpacity={0.8}>
                <View style={[s.qaIconRing, { borderColor: a.color + '55' }]}>
                  <Ionicons name={a.icon as any} size={22} color={a.color} />
                </View>
                <Text style={s.qaLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Announcement banner */}
        {applicationNotifications.length > 0 && (
          <View style={s.bannerSection}>
            {applicationNotifications.length === 1 ? (
              <AnnouncementCard notif={applicationNotifications[0]} />
            ) : (
              <View>
                <ScrollView
                  ref={notifScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  scrollEnabled={false}
                  style={{ width: SW }}
                >
                  {applicationNotifications.map(n => (
                    <View key={n.id} style={{ width: SW }}>
                      <AnnouncementCard notif={n} />
                    </View>
                  ))}
                </ScrollView>
                <View style={s.dotRow}>
                  {applicationNotifications.map((_, i) => (
                    <TouchableOpacity key={i} onPress={() => setCurrentNotifIndex(i)}>
                      <View style={[s.dot, i === currentNotifIndex && s.dotActive]} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Stats grid */}
        <View style={s.statsCard}>
          <Text style={s.statsTitle}>Summary</Text>
          <View style={s.statsGrid}>
            {[
              { icon: 'arrow-down-circle', color: C.green,  label: 'Deposited',    val: transactionStats.totalDeposits },
              { icon: 'arrow-up-circle',   color: C.red,    label: 'Withdrawn',    val: transactionStats.totalWithdrawals },
              { icon: 'gift',              color: C.amber,  label: 'Tips Sent',    val: transactionStats.totalTips },
              { icon: 'people',            color: C.brand,  label: 'Referrals',    val: transactionStats.totalReferrals },
            ].map((s2, i) => (
              <View key={i} style={s.statItem}>
                <Ionicons name={s2.icon as any} size={18} color={s2.color} />
                <Text style={s.statValue} numberOfLines={1}>{fmt(s2.val)}</Text>
                <Text style={s.statLabel}>{s2.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent transactions */}
        <View style={s.txSection}>
          <View style={s.txHeader}>
            <Text style={s.txSectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => setAllTxVisible(true)}>
              <Text style={s.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>

          {loadingTransactions ? (
            <View style={s.txLoading}>
              <ActivityIndicator color={C.brand} size="small" />
              <Text style={s.txLoadingText}>Loading…</Text>
            </View>
          ) : allTransactions.length === 0 ? (
            <View style={s.txEmpty}>
              <Ionicons name="document-text-outline" size={40} color={C.textMuted} />
              <Text style={s.txEmptyTitle}>No transactions yet</Text>
              <Text style={s.txEmptySub}>Deposit funds or share your tipping link to get started</Text>
            </View>
          ) : (
            allTransactions.slice(0, 4).map(item => (
              <TouchableOpacity
                key={item.id}
                style={s.txRow}
                onPress={() => { setSelectedTx(item); setTxDetailVisible(true); }}
                activeOpacity={0.75}
              >
                <View style={s.txIconBox}>
                  <TxIcon type={item.type} size={20} />
                </View>
                <View style={s.txMeta}>
                  <Text style={s.txDesc} numberOfLines={1}>{item.resolvedDescription || item.description}</Text>
                  <Text style={s.txDate}>{fmtDate(item.createdAt)}</Text>
                </View>
                <View style={s.txAmtWrap}>
                  <Text style={[s.txAmt, (item.type === 'withdrawal' || item.type === 'tip_sent') ? s.txAmtNeg : s.txAmtPos]}>
                    {(item.type === 'withdrawal' || item.type === 'tip_sent') ? '−' : '+'}{fmt(Math.abs(item.amount))}
                  </Text>
                  <View style={[s.txStatusDot, item.status === 'completed' ? s.dotGreen : item.status === 'pending' ? s.dotAmber : s.dotRed]} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* ── Modals ── */}
      <TxDetailModal
        visible={txDetailVisible}
        txn={selectedTx}
        onClose={() => setTxDetailVisible(false)}
        fmt={fmt}
        fmtDate={fmtDate}
      />
      <AllTxModal
        visible={allTxVisible}
        data={allTransactions}
        loading={loadingTransactions}
        onClose={() => setAllTxVisible(false)}
        onPressTx={(t) => { setSelectedTx(t); setTxDetailVisible(true); setAllTxVisible(false); }}
        fmt={fmt}
        fmtDate={fmtDate}
      />
      <TippingLinkModal
        visible={tippingModalVisible}
        onClose={() => setTippingModalVisible(false)}
        tippingLink={tippingLink}
        user={user}
        onCopy={copyTippingLink}
        onShare={shareTippingLink}
      />
      <EarnMoreModal
        visible={earnMoreVisible}
        onClose={() => setEarnMoreVisible(false)}
        onGoToTippingLink={() => setTippingModalVisible(true)}
      />
      <ErrorModal
        visible={errorModalVisible}
        title={errorTitle}
        message={errorMessage}
        onClose={() => setErrorModalVisible(false)}
      />
    </SafeAreaView>
  );
};

// ─── Announcement card (extracted for reuse in single + carousel) ─────────────
type NotifWithLink = ApplicationNotification & { link?: string };

const AnnouncementCard: React.FC<{ notif: ApplicationNotification }> = ({ notif }) => {
  const n = notif as NotifWithLink;
  const meta = notifMeta(n.type);
  const isLinkable = !!n.link?.trim();

  const handlePress = async () => {
    if (!n.link?.trim()) return;
    const url = n.link.trim();
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Cannot open link", `No app found to open:\n${url}`);
      }
    } catch {
      Alert.alert("Cannot open link", `Failed to open:\n${url}`);
    }
  };

  const Wrapper: any = isLinkable ? TouchableOpacity : View;
  return (
    <Wrapper
      style={[s.bannerCard, { borderLeftColor: meta.color }]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      <View style={[s.bannerIconBox, { backgroundColor: meta.bg }]}>
        <Ionicons name={meta.icon as any} size={18} color={meta.color} />
      </View>
      <View style={s.bannerText}>
        <Text style={s.bannerTitle}>{n.title}</Text>
        <Text style={s.bannerMsg} numberOfLines={2}>{n.message}</Text>
        {isLinkable && (
          <View style={s.bannerLinkRow}>
            <Ionicons name="open-outline" size={11} color={meta.color} />
            <Text style={[s.bannerLinkText, { color: meta.color }]} numberOfLines={1}>
              {n.link!.replace(/^https?:\/\//, "").split("/")[0]}
            </Text>
          </View>
        )}
      </View>
      {isLinkable && (
        <View style={[s.bannerArrow, { backgroundColor: meta.bg }]}>
          <Ionicons name="chevron-forward" size={14} color={meta.color} />
        </View>
      )}
    </Wrapper>
  );
};

// ─── Main screen styles ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.brand },
  scroll: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 32 },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: C.brand,
  },
  logo: { fontSize: 22, fontWeight: '900', color: C.white, letterSpacing: -0.3 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  earnBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  earnBtnText: { color: C.white, fontSize: 12, fontWeight: '600' },
  notifBtn:    { position: 'relative', padding: 6 },
  badge: {
    position: 'absolute', top: 2, right: 2,
    backgroundColor: C.red, borderRadius: 9, minWidth: 18, height: 18,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: C.brand,
  },
  badgeText:    { color: C.white, fontSize: 10, fontWeight: '800' },
  deviceDotWrap:{ justifyContent: 'center', alignItems: 'center', padding: 4 },
  deviceDot:    { width: 7, height: 7, borderRadius: 4 },
  deviceDotOn:  { backgroundColor: C.green },
  deviceDotOff: { backgroundColor: C.red },

  // Hero / balance
  hero: {
    backgroundColor: C.brand,
    paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.6)', fontSize: 10,
    fontWeight: '700', letterSpacing: 1.4, marginBottom: 4,
  },
  heroAmount: {
    color: C.white, fontSize: 38, fontWeight: '900',
    letterSpacing: -1, marginBottom: 6,
  },
  heroRefresh: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20 },
  heroRefreshText: { color: 'rgba(255,255,255,0.55)', fontSize: 11 },

  // Quick actions
  qaRow:      { flexDirection: 'row', justifyContent: 'space-between' },
  qaBtn:      { alignItems: 'center', flex: 1 },
  qaIconRing: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  qaLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600', textAlign: 'center' },

  // Announcement banners
  bannerSection: { marginTop: 16 },
  bannerCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 14, padding: 14,
    marginHorizontal: 16,
    borderLeftWidth: 4, borderLeftColor: C.brand,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  bannerIconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  bannerText:  { flex: 1 },
  bannerTitle: { fontSize: 13, fontWeight: '700', color: C.textPrimary, marginBottom: 2 },
  bannerMsg:   { fontSize: 12, color: C.textSub, lineHeight: 17 },
  bannerLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  bannerLinkText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  bannerArrow: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', marginLeft: 6,
  },
  dotRow:      { flexDirection: 'row', justifyContent: 'center', marginTop: 8, gap: 6 },
  dot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  dotActive:   { backgroundColor: C.brand, width: 16 },

  // Stats card
  statsCard: {
    backgroundColor: C.surface, marginHorizontal: 16, marginTop: 16,
    borderRadius: 18, padding: 18,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  statsTitle: { fontSize: 14, fontWeight: '800', color: C.textPrimary, marginBottom: 14, letterSpacing: 0.1 },
  statsGrid:  { flexDirection: 'row', justifyContent: 'space-between' },
  statItem:   { alignItems: 'center', flex: 1 },
  statValue:  { fontSize: 12, fontWeight: '800', color: C.textPrimary, marginTop: 5, marginBottom: 2 },
  statLabel:  { fontSize: 10, color: C.textMuted, textAlign: 'center' },

  // Transaction section
  txSection: {
    backgroundColor: C.surface, marginHorizontal: 16, marginTop: 16,
    borderRadius: 18, padding: 18,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  txHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  txSectionTitle:{ fontSize: 14, fontWeight: '800', color: C.textPrimary },
  viewAll:       { fontSize: 13, fontWeight: '600', color: C.brand },
  txLoading:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 24 },
  txLoadingText: { fontSize: 13, color: C.textMuted },
  txEmpty:       { alignItems: 'center', paddingVertical: 32 },
  txEmptyTitle:  { fontSize: 15, fontWeight: '700', color: C.textSub, marginTop: 10, marginBottom: 4 },
  txEmptySub:    { fontSize: 12, color: C.textMuted, textAlign: 'center', lineHeight: 18 },

  txRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  txIconBox: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: C.brandFaint,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  txMeta:    { flex: 1 },
  txDesc:    { fontSize: 13, fontWeight: '600', color: C.textPrimary, marginBottom: 2 },
  txDate:    { fontSize: 11, color: C.textMuted },
  txAmtWrap: { alignItems: 'flex-end', gap: 4 },
  txAmt:     { fontSize: 13, fontWeight: '800' },
  txAmtPos:  { color: C.green },
  txAmtNeg:  { color: C.red },
  txStatusDot: { width: 7, height: 7, borderRadius: 4 },
  dotGreen:  { backgroundColor: C.green },
  dotAmber:  { backgroundColor: C.amber },
  dotRed:    { backgroundColor: C.red },
});

// ─── Modal styles ─────────────────────────────────────────────────────────────
const ms = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end',
  },

  // Full-screen modals (All Tx, Tipping, Earn More)
  fullRoot:   { flex: 1, backgroundColor: C.brand },
  fullHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  fullBack: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  fullTitle: { fontSize: 18, fontWeight: '800', color: C.white, letterSpacing: -0.2 },
  fullBody:  { flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24 },

  // ── Transaction detail bottom sheet ──
  txSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 36,
  },
  txIconWrap: {
    alignSelf: 'center', width: 60, height: 60, borderRadius: 30,
    backgroundColor: C.brandFaint, alignItems: 'center', justifyContent: 'center',
    marginTop: 16, marginBottom: 12,
    borderWidth: 2, borderColor: C.border,
  },
  txTitle:    { fontSize: 20, fontWeight: '800', color: C.textPrimary, textAlign: 'center', marginBottom: 16 },
  txAmountBox:{ borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 16 },
  txAmountEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  txAmountValue:   { fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  txRows: {
    backgroundColor: '#FAFAFA', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border, marginBottom: 20,
  },
  txRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  txRowLabel: { fontSize: 12, color: C.textMuted, fontWeight: '500', flex: 0.4 },
  txRowValue: { fontSize: 13, color: C.textPrimary, fontWeight: '600', flex: 0.6, textAlign: 'right' },
  txCloseBtn: {
    backgroundColor: C.brand, borderRadius: 14, height: 50,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.brand, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  txCloseBtnText: { color: C.white, fontSize: 15, fontWeight: '800' },

  // ── All Transactions modal body ──
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    margin: 16, marginBottom: 0,
    borderWidth: 1.5, borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.textPrimary },
  filterScroll:{ marginTop: 10, marginBottom: 4 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.surface,
  },
  filterChipActive:     { backgroundColor: C.brand, borderColor: C.brand },
  filterChipText:       { fontSize: 12, fontWeight: '600', color: C.brand },
  filterChipTextActive: { color: C.white },
  loadingBox:  { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 10 },
  loadingText: { fontSize: 13, color: C.textMuted },
  emptyBox:    { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 32 },
  emptyTitle:  { fontSize: 16, fontWeight: '700', color: C.textSub, marginTop: 12, marginBottom: 6 },
  emptySub:    { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 19 },
  txItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 14, padding: 14,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  txItemLeft:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  txItemIcon: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: C.brandFaint, alignItems: 'center', justifyContent: 'center',
  },
  txItemDesc:  { fontSize: 13, fontWeight: '600', color: C.textPrimary },
  txItemDate:  { fontSize: 11, color: C.textMuted, marginTop: 2 },
  txItemAmt:   { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  txStatusPill:{ borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  statusCompleted: { backgroundColor: C.greenFaint },
  statusPending:   { backgroundColor: C.amberFaint },
  statusFailed:    { backgroundColor: C.redFaint },
  txStatusText:    { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: C.textSub },

  // ── Tipping link modal ──
  tipUserBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.brandFaint, borderRadius: 16, padding: 16, marginBottom: 16,
  },
  tipAvatarRing: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.brandLight,
  },
  tipAvatarText:  { fontSize: 22, fontWeight: '900', color: C.white },
  tipUsername:    { fontSize: 16, fontWeight: '800', color: C.textPrimary },
  tipVerifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  tipVerifiedText:{ fontSize: 11, color: C.green, fontWeight: '600' },
  tipLinkBox: {
    backgroundColor: C.surface, borderRadius: 14, padding: 16,
    borderWidth: 1.5, borderColor: C.border, marginBottom: 16,
  },
  tipLinkEyebrow: { fontSize: 10, fontWeight: '700', color: C.brand, letterSpacing: 1.2, marginBottom: 6 },
  tipLinkText:    { fontSize: 14, color: C.textPrimary, fontFamily: 'monospace', lineHeight: 20 },
  tipActions:     { flexDirection: 'row', gap: 12, marginBottom: 20 },
  tipCopyBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: C.brand, backgroundColor: C.brandFaint,
  },
  tipCopyText:  { fontSize: 14, fontWeight: '700', color: C.brand },
  tipShareBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    height: 48, borderRadius: 12, backgroundColor: C.brand,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  tipShareText:   { fontSize: 14, fontWeight: '700', color: C.white },
  tipHowBox: {
    backgroundColor: C.bg, borderRadius: 14, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: C.border,
  },
  tipHowTitle: { fontSize: 13, fontWeight: '800', color: C.textPrimary, marginBottom: 12 },
  tipHowRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  tipHowIcon: {
    width: 30, height: 30, borderRadius: 9, backgroundColor: C.brandFaint,
    alignItems: 'center', justifyContent: 'center',
  },
  tipHowText:   { flex: 1, fontSize: 13, color: C.textSub, lineHeight: 19, paddingTop: 5 },
  tipCloseBtn: {
    height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  tipCloseBtnText: { fontSize: 14, fontWeight: '700', color: C.textSub },

  // ── Earn More modal ──
  earnHero: { alignItems: 'center', paddingVertical: 24 },
  earnHeroEmoji: { fontSize: 44, marginBottom: 10 },
  earnHeroTitle: { fontSize: 22, fontWeight: '900', color: C.textPrimary, textAlign: 'center', letterSpacing: -0.3, marginBottom: 6 },
  earnHeroSub:   { fontSize: 14, color: C.textSub, textAlign: 'center', lineHeight: 20 },
  earnSection: {
    backgroundColor: C.surface, borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: C.border,
  },
  earnSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  earnSectionIcon: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: C.brandFaint,
    alignItems: 'center', justifyContent: 'center',
  },
  earnSectionTitle: { fontSize: 14, fontWeight: '800', color: C.textPrimary, flex: 1 },
  earnSectionBody:  { fontSize: 13, color: C.textSub, lineHeight: 20 },
  earnBullet:       { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 7 },
  earnBulletDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: C.brand, marginTop: 6 },
  earnBulletText:   { flex: 1, fontSize: 13, color: C.textSub, lineHeight: 20 },
  whatsappBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#25D366', borderRadius: 12, height: 48, marginVertical: 16,
  },
  whatsappBtnText: { color: C.white, fontSize: 14, fontWeight: '700' },
  earnCTA: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.brand, borderRadius: 12, height: 50, marginBottom: 12,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  earnCTAText:       { color: C.white, fontSize: 15, fontWeight: '800' },
  earnClosePlain:    { height: 46, alignItems: 'center', justifyContent: 'center' },
  earnClosePlainText:{ fontSize: 14, color: C.textMuted, fontWeight: '600' },

  // ── Error modal ──
  errSheet: {
    backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 36, alignItems: 'center',
  },
  errIconRing: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: C.redFaint,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 20, marginBottom: 16, borderWidth: 2, borderColor: C.red + '40',
  },
  errTitle: { fontSize: 20, fontWeight: '800', color: C.textPrimary, marginBottom: 8, textAlign: 'center' },
  errBody:  { fontSize: 14, color: C.textSub, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  errBtn: {
    width: '100%', height: 50, borderRadius: 12, backgroundColor: C.red,
    alignItems: 'center', justifyContent: 'center',
  },
  errBtnText: { color: C.white, fontSize: 15, fontWeight: '800' },
});