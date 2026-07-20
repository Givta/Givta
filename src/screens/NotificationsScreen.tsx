import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch, Alert,
  TouchableOpacity, Modal, RefreshControl, FlatList,
  SafeAreaView, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { notificationCollection, Notification } from '../collections/notifications';

// ─── Design tokens (matches Givta system) ─────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Handle = () => (
  <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 2 }}>
    <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C.border }} />
  </View>
);

interface NotificationItem extends Notification {}

const NOTIFICATION_TYPE_META: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  transaction: { icon: 'swap-horizontal',      color: C.blue,  bg: C.blueFaint,  label: 'Transaction' },
  referral:    { icon: 'people',                color: C.brand, bg: C.brandFaint, label: 'Referral'    },
  tip:         { icon: 'gift',                  color: C.amber, bg: C.amberFaint, label: 'Tip'         },
  security:    { icon: 'shield-checkmark',      color: C.green, bg: C.greenFaint, label: 'Security'    },
  system:      { icon: 'megaphone',             color: C.textSub, bg: C.bg,       label: 'System'      },
};

const getTypeMeta = (type: string) =>
  NOTIFICATION_TYPE_META[type] || { icon: 'notifications', color: C.brand, bg: C.brandFaint, label: type };

const fmtDate = (d: any) => {
  try {
    const date = d?.toDate ? d.toDate() : new Date(d);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 1)  return 'Just now';
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days  < 7)  return `${days}d ago`;
    return new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short' }).format(date);
  } catch { return ''; }
};

// ─── Settings Modal ───────────────────────────────────────────────────────────
const SettingsModal: React.FC<{
  visible: boolean;
  settings: Record<string, boolean>;
  saving: boolean;
  onToggle: (key: string, val: boolean) => void;
  onSave: () => void;
  onClose: () => void;
}> = ({ visible, settings, saving, onToggle, onSave, onClose }) => {
  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <View style={sm.section}>
      <Text style={sm.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const Row: React.FC<{
    label: string; desc: string; settingKey: string; locked?: boolean;
  }> = ({ label, desc, settingKey, locked }) => (
    <View style={sm.row}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={sm.rowLabel}>{label}</Text>
        <Text style={sm.rowDesc}>{desc}</Text>
      </View>
      <Switch
        value={settings[settingKey] ?? false}
        onValueChange={locked ? undefined : (v) => onToggle(settingKey, v)}
        disabled={locked}
        trackColor={{ false: C.border, true: C.brand }}
        thumbColor={C.white}
        ios_backgroundColor={C.border}
      />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={sm.root}>
        {/* Header */}
        <View style={sm.header}>
          <TouchableOpacity style={sm.backBtn} onPress={onClose}>
            <Ionicons name="close" size={18} color={C.white} />
          </TouchableOpacity>
          <Text style={sm.title}>Notification Settings</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView style={sm.body} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <Section title="Delivery channels">
            <Row label="Push notifications"  desc="Receive alerts directly on your device"       settingKey="pushNotifications"  />
            <Row label="Email notifications" desc="Get notified via your registered email"        settingKey="emailNotifications" />
            <Row label="SMS notifications"   desc="Receive text messages (carrier rates apply)"   settingKey="smsNotifications"   />
          </Section>

          <Section title="Alert types">
            <Row label="Transaction alerts" desc="Deposits, withdrawals and transfers"             settingKey="transactionAlerts" />
            <Row label="Referral alerts"    desc="Earn notifications from your referrals"          settingKey="referralAlerts"    />
            <Row label="Tip alerts"         desc="When someone sends you a tip"                    settingKey="tipAlerts"         />
          </Section>

          <Section title="Security & marketing">
            <Row label="Security alerts"  desc="Login activity and important account events"      settingKey="securityAlerts"  locked />
            <Row label="Marketing emails" desc="Product news, promotions and creator tips"        settingKey="marketingEmails" />
          </Section>

          {/* Master toggle */}
          <View style={sm.masterRow}>
            <View style={{ flex: 1 }}>
              <Text style={sm.masterLabel}>All notifications</Text>
              <Text style={sm.masterDesc}>Master switch — turns everything on or off</Text>
            </View>
            <Switch
              value={settings.notifications ?? true}
              onValueChange={(v) => onToggle('notifications', v)}
              trackColor={{ false: C.border, true: C.brand }}
              thumbColor={C.white}
              ios_backgroundColor={C.border}
            />
          </View>

          {/* Save */}
          <TouchableOpacity
            style={[sm.saveBtn, saving && { opacity: 0.7 }]}
            onPress={onSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={C.white} size="small" />
              : <><Ionicons name="checkmark" size={18} color={C.white} /><Text style={sm.saveBtnText}>Save settings</Text></>
            }
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ─── Notification Detail Modal ────────────────────────────────────────────────
const NotifDetailModal: React.FC<{
  visible: boolean;
  notif: NotificationItem | null;
  onClose: () => void;
}> = ({ visible, notif, onClose }) => {
  if (!notif) return null;
  const meta = getTypeMeta(notif.type);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={dm.overlay}>
        <View style={dm.sheet}>
          <Handle />
          <View style={[dm.iconRing, { backgroundColor: meta.bg }]}>
            <Ionicons name={meta.icon} size={28} color={meta.color} />
          </View>
          <View style={[dm.typePill, { backgroundColor: meta.bg }]}>
            <Text style={[dm.typePillText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <Text style={dm.title}>{notif.title}</Text>
          <Text style={dm.message}>{notif.message}</Text>
          <View style={dm.metaRow}>
            <Ionicons name="time-outline" size={13} color={C.textMuted} />
            <Text style={dm.metaText}>{fmtDate(notif.createdAt)}</Text>
            {!notif.read && (
              <View style={dm.unreadPill}><Text style={dm.unreadPillText}>Unread</Text></View>
            )}
          </View>
          <TouchableOpacity style={dm.closeBtn} onPress={onClose}>
            <Text style={dm.closeBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export const NotificationsScreen: React.FC = () => {
  const { user } = useAuth();

  const [settings, setSettings] = useState({
    pushNotifications: true, emailNotifications: false, smsNotifications: false,
    transactionAlerts: true, referralAlerts: true, tipAlerts: true,
    securityAlerts: true, marketingEmails: false, notifications: true,
  });
  const [notifications, setNotifications]       = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount]           = useState(0);
  const [loading, setLoading]                   = useState(true);
  const [refreshing, setRefreshing]             = useState(false);
  const [filter, setFilter]                     = useState<string>('all');
  const [settingsVisible, setSettingsVisible]   = useState(false);
  const [savingSettings, setSavingSettings]     = useState(false);
  const [selectedNotif, setSelectedNotif]       = useState<NotificationItem | null>(null);
  const [detailVisible, setDetailVisible]       = useState(false);

  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try { await Promise.all([loadNotifications(), loadPreferences()]); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadNotifications = async () => {
    try {
      const res = await apiService.getNotifications();
      if (res.success && res.data) {
        setNotifications(res.data?.notifications ?? []);
        setUnreadCount(res.data?.unreadCount ?? 0);
      }
    } catch (e) { console.error(e); }
  };

  const loadPreferences = async () => {
    try {
      const res = await apiService.getUserPreferences();
      if (res.success && res.data) {
        setSettings(prev => ({ ...prev, notifications: res.data?.notifications ?? true }));
      }
    } catch (e) { console.error(e); }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const res = await apiService.markNotificationAsRead(id);
      if (res.success) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch { Alert.alert('Error', 'Could not mark as read'); }
  };

  const markAllAsRead = async () => {
    try {
      const res = await apiService.markAllNotificationsAsRead();
      if (res.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      } else throw new Error(res.error);
    } catch { Alert.alert('Error', 'Could not mark all as read'); }
  };

  const savePreferences = async () => {
    setSavingSettings(true);
    try {
      const res = await apiService.updateUserPreferences({
        notifications: settings.notifications, language: 'en', currency: 'NGN', theme: 'light',
      });
      if (res.success) {
        setSettingsVisible(false);
        Alert.alert('Saved', 'Notification settings updated.');
      } else throw new Error(res.error);
    } catch { Alert.alert('Error', 'Failed to save settings'); }
    finally { setSavingSettings(false); }
  };

  const updateSetting = (key: string, value: boolean) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  const openNotif = (item: NotificationItem) => {
    setSelectedNotif(item);
    setDetailVisible(true);
    if (!item.read) markAsRead(item.id);
  };

  const filtered = notifications.filter(n => {
    if (filter === 'all')    return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const FILTERS = [
    { key: 'all',         label: 'All'          },
    { key: 'unread',      label: 'Unread'       },
    { key: 'transaction', label: 'Transactions' },
    { key: 'referral',    label: 'Referrals'    },
    { key: 'tip',         label: 'Tips'         },
    { key: 'security',    label: 'Security'     },
    { key: 'system',      label: 'System'       },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root}>
      {/* ── Top bar ── */}
      <View style={s.topBar}>
        <View>
          <Text style={s.topTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={s.topSub}>{unreadCount} unread</Text>
          )}
        </View>
        <TouchableOpacity style={s.settingsBtn} onPress={() => setSettingsVisible(true)}>
          <Ionicons name="settings-outline" size={20} color={C.white} />
        </TouchableOpacity>
      </View>

      {/* ── Stats strip ── */}
      <View style={s.statsStrip}>
        <View style={s.statCell}>
          <Text style={s.statNum}>{notifications.length}</Text>
          <Text style={s.statLabel}>Total</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statCell}>
          <Text style={[s.statNum, { color: C.brand }]}>{unreadCount}</Text>
          <Text style={s.statLabel}>Unread</Text>
        </View>
        <View style={s.statDivider} />
        <TouchableOpacity style={s.markAllBtn} onPress={markAllAsRead} disabled={unreadCount === 0}>
          <Ionicons name="checkmark-done" size={16} color={unreadCount === 0 ? C.textMuted : C.brand} />
          <Text style={[s.markAllText, { color: unreadCount === 0 ? C.textMuted : C.brand }]}>
            Mark all read
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Filter chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterScroll}
        contentContainerStyle={s.filterContent}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.filterChip, filter === f.key && s.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[s.filterChipText, filter === f.key && s.filterChipTextActive]}>
              {f.label}
            </Text>
            {f.key === 'unread' && unreadCount > 0 && (
              <View style={s.filterBadge}>
                <Text style={s.filterBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── List ── */}
      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator color={C.brand} size="large" />
          <Text style={s.loadingText}>Loading notifications…</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.emptyBox}>
          <View style={s.emptyIconRing}>
            <Ionicons name="notifications-off-outline" size={36} color={C.textMuted} />
          </View>
          <Text style={s.emptyTitle}>
            {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
          </Text>
          <Text style={s.emptySub}>
            {filter === 'unread'
              ? 'You have no unread notifications'
              : "We'll notify you when something happens"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.brand} />}
          contentContainerStyle={s.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const meta = getTypeMeta(item.type);
            return (
              <TouchableOpacity
                style={[s.notifCard, !item.read && s.notifCardUnread]}
                onPress={() => openNotif(item)}
                activeOpacity={0.78}
              >
                {/* Unread left bar */}
                {!item.read && <View style={s.unreadBar} />}

                {/* Icon */}
                <View style={[s.notifIcon, { backgroundColor: meta.bg }]}>
                  <Ionicons name={meta.icon} size={18} color={meta.color} />
                </View>

                {/* Content */}
                <View style={s.notifBody}>
                  <View style={s.notifTitleRow}>
                    <Text style={s.notifTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={s.notifTime}>{fmtDate(item.createdAt)}</Text>
                  </View>
                  <Text style={s.notifMsg} numberOfLines={2}>{item.message}</Text>
                  <View style={[s.notifTypePill, { backgroundColor: meta.bg }]}>
                    <Text style={[s.notifTypeText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                </View>

                {/* Unread dot */}
                {!item.read && <View style={s.unreadDot} />}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ── Modals ── */}
      <SettingsModal
        visible={settingsVisible}
        settings={settings}
        saving={savingSettings}
        onToggle={updateSetting}
        onSave={savePreferences}
        onClose={() => setSettingsVisible(false)}
      />
      <NotifDetailModal
        visible={detailVisible}
        notif={selectedNotif}
        onClose={() => setDetailVisible(false)}
      />
    </SafeAreaView>
  );
};

// ─── Screen styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.brand },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    backgroundColor: C.brand,
  },
  topTitle: { fontSize: 24, fontWeight: '900', color: C.white, letterSpacing: -0.3 },
  topSub:   { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  settingsBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  statsStrip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface,
    marginHorizontal: 16, marginBottom: 0,
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 20,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  statCell:    { flex: 1, alignItems: 'center' },
  statNum:     { fontSize: 22, fontWeight: '900', color: C.textPrimary },
  statLabel:   { fontSize: 11, color: C.textMuted, marginTop: 2, fontWeight: '600', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 36, backgroundColor: C.border },
  markAllBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  markAllText: { fontSize: 12, fontWeight: '700' },

  filterScroll:  { backgroundColor: C.brand, marginTop: 14 },
  filterContent: { paddingHorizontal: 16, paddingBottom: 14, gap: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  filterChipActive:     { backgroundColor: C.white },
  filterChipText:       { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  filterChipTextActive: { color: C.brand },
  filterBadge: {
    backgroundColor: C.red, borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  filterBadgeText: { color: C.white, fontSize: 9, fontWeight: '800' },

  loadingBox:  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg, gap: 12 },
  loadingText: { fontSize: 14, color: C.textMuted },
  emptyBox:    { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg, paddingHorizontal: 40 },
  emptyIconRing: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: C.brandFaint,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 2, borderColor: C.border,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.textSub, marginBottom: 6, textAlign: 'center' },
  emptySub:   { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 20 },

  listContent: { padding: 16, paddingBottom: 32, backgroundColor: C.bg },

  notifCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: C.surface, borderRadius: 16, padding: 14,
    overflow: 'hidden',
    shadowColor: C.brand, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  notifCardUnread: { borderWidth: 1, borderColor: C.brand + '30' },
  unreadBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: 3, backgroundColor: C.brand, borderRadius: 3,
  },
  notifIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 12, marginLeft: 8,
  },
  notifBody:     { flex: 1 },
  notifTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  notifTitle:    { fontSize: 14, fontWeight: '700', color: C.textPrimary, flex: 1, marginRight: 8 },
  notifTime:     { fontSize: 11, color: C.textMuted, flexShrink: 0 },
  notifMsg:      { fontSize: 13, color: C.textSub, lineHeight: 18, marginBottom: 8 },
  notifTypePill: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  notifTypeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.brand, marginLeft: 6, marginTop: 4,
  },
});

// ─── Settings modal styles ────────────────────────────────────────────────────
const sm = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.brand },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', color: C.white, letterSpacing: -0.2 },
  body:  { flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24 },

  section: {
    backgroundColor: C.surface, borderRadius: 16, marginBottom: 12,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: C.brand,
    letterSpacing: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  rowLabel: { fontSize: 14, fontWeight: '600', color: C.textPrimary, marginBottom: 2 },
  rowDesc:  { fontSize: 12, color: C.textMuted, lineHeight: 17 },

  masterRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.brandFaint, borderRadius: 16, padding: 16, marginBottom: 20,
    borderWidth: 1.5, borderColor: C.brand + '40',
  },
  masterLabel: { fontSize: 15, fontWeight: '800', color: C.textPrimary, marginBottom: 2 },
  masterDesc:  { fontSize: 12, color: C.textSub },

  saveBtn: {
    backgroundColor: C.brand, borderRadius: 14, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: C.brand, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  saveBtnText: { color: C.white, fontSize: 15, fontWeight: '800' },
});

// ─── Detail modal styles ──────────────────────────────────────────────────────
const dm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 36, alignItems: 'center',
  },
  iconRing: {
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 20, marginBottom: 12,
    borderWidth: 2, borderColor: C.border,
  },
  typePill: {
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 14,
  },
  typePillText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  title:   { fontSize: 20, fontWeight: '800', color: C.textPrimary, textAlign: 'center', marginBottom: 10, letterSpacing: -0.2 },
  message: { fontSize: 14, color: C.textSub, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 24 },
  metaText:{ fontSize: 12, color: C.textMuted },
  unreadPill: {
    backgroundColor: C.brandFaint, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2, marginLeft: 4,
  },
  unreadPillText: { fontSize: 10, fontWeight: '700', color: C.brand },
  closeBtn: {
    width: '100%', height: 50, borderRadius: 12,
    backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.brand, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  closeBtnText: { color: C.white, fontSize: 15, fontWeight: '800' },
});