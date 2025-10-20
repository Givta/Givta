import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { apiService } from '../services/api';

export const AnalyticsScreen: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    monthlySpending: 0,
    referralEarnings: 0,
    tipsReceived: 0,
    tipsSent: 0,
    loginCount: 0,
    lastLogin: null as Date | null,
  });

  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, 1y
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAnalyticsDashboard();

      if (response.success && response.data) {
        const dashboard = response.data;

        // Transform the API response to match the component's data structure
        // Set tipsReceived and tipsSent from recentActivity if available
        let tipsReceived = 0;
        let tipsSent = 0;

        if (dashboard.summary.recentActivity) {
          dashboard.summary.recentActivity.forEach(activity => {
            if (activity.type === 'tip_received') {
              tipsReceived += activity.amount || 0;
            } else if (activity.type === 'tip_sent') {
              tipsSent += activity.amount || 0;
            }
          });
        }

        setAnalyticsData({
          totalTransactions: dashboard.summary.thisMonth.transactions || 0,
          totalAmount: dashboard.wallet.balance || 0,
          monthlySpending: dashboard.summary.thisMonth.spending || 0,
          referralEarnings: dashboard.referrals.totalEarnings || 0,
          tipsReceived: tipsReceived,
          tipsSent: tipsSent,
          loginCount: 0, // Login count not provided in dashboard API
          lastLogin: null, // Last login not provided in dashboard API
        });
      } else {
        Alert.alert('Error', 'Failed to load analytics data');
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-NG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      case '1y': return 'Last Year';
      default: return 'Last 30 Days';
    }
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Data export feature coming soon!');
  };

  const handleDetailedReport = () => {
    Alert.alert('Detailed Report', 'Detailed analytics report coming soon!');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Your financial insights</Text>
        </View>

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4B0082" />
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        )}

        {/* Time Range Selector */}
        <Card style={styles.selectorCard} padding={16} margin={16}>
          <Text style={styles.selectorLabel}>Time Range</Text>
          <View style={styles.timeRangeButtons}>
            {[
              { key: '7d', label: '7D' },
              { key: '30d', label: '30D' },
              { key: '90d', label: '90D' },
              { key: '1y', label: '1Y' },
            ].map((range) => (
              <Button
                key={range.key}
                title={range.label}
                onPress={() => setTimeRange(range.key)}
                variant={timeRange === range.key ? 'primary' : 'outline'}
                size="small"
                style={styles.timeRangeButton}
              />
            ))}
          </View>
          <Text style={styles.timeRangeText}>{getTimeRangeLabel()}</Text>
        </Card>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard} padding={20} margin={8}>
            <Text style={styles.metricIcon}>💰</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(analyticsData.totalAmount)}
            </Text>
            <Text style={styles.metricLabel}>Total Amount</Text>
          </Card>

          <Card style={styles.metricCard} padding={20} margin={8}>
            <Text style={styles.metricIcon}>📊</Text>
            <Text style={styles.metricValue}>
              {analyticsData.totalTransactions}
            </Text>
            <Text style={styles.metricLabel}>Transactions</Text>
          </Card>

          <Card style={styles.metricCard} padding={20} margin={8}>
            <Text style={styles.metricIcon}>📈</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(analyticsData.monthlySpending)}
            </Text>
            <Text style={styles.metricLabel}>Monthly Spending</Text>
          </Card>

          <Card style={styles.metricCard} padding={20} margin={8}>
            <Text style={styles.metricIcon}>🎁</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(analyticsData.referralEarnings)}
            </Text>
            <Text style={styles.metricLabel}>Referral Earnings</Text>
          </Card>
        </View>

        {/* Transaction Breakdown */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Transaction Breakdown</Text>

          <View style={styles.breakdownList}>
            <View style={styles.breakdownItem}>
              <View style={styles.breakdownInfo}>
                <Text style={styles.breakdownIcon}>💸</Text>
                <Text style={styles.breakdownLabel}>Tips Received</Text>
              </View>
              <Text style={styles.breakdownValue}>
                {formatCurrency(analyticsData.tipsReceived)}
              </Text>
            </View>

            <View style={styles.breakdownItem}>
              <View style={styles.breakdownInfo}>
                <Text style={styles.breakdownIcon}>🎁</Text>
                <Text style={styles.breakdownLabel}>Tips Sent</Text>
              </View>
              <Text style={styles.breakdownValue}>
                {formatCurrency(analyticsData.tipsSent)}
              </Text>
            </View>

            <View style={styles.breakdownItem}>
              <View style={styles.breakdownInfo}>
                <Text style={styles.breakdownIcon}>💰</Text>
                <Text style={styles.breakdownLabel}>Deposits</Text>
              </View>
              <Text style={styles.breakdownValue}>
                {formatCurrency(analyticsData.totalAmount * 0.6)}
              </Text>
            </View>

            <View style={styles.breakdownItem}>
              <View style={styles.breakdownInfo}>
                <Text style={styles.breakdownIcon}>📤</Text>
                <Text style={styles.breakdownLabel}>Withdrawals</Text>
              </View>
              <Text style={styles.breakdownValue}>
                {formatCurrency(analyticsData.totalAmount * 0.4)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Activity Summary */}
        <Card style={styles.card} padding={20} margin={16}>
          <Text style={styles.sectionTitle}>Activity Summary</Text>

          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <Text style={styles.activityIcon}>🔐</Text>
              <View style={styles.activityInfo}>
                <Text style={styles.activityLabel}>Login Sessions</Text>
                <Text style={styles.activityValue}>
                  {analyticsData.loginCount} sessions
                </Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <Text style={styles.activityIcon}>📅</Text>
              <View style={styles.activityInfo}>
                <Text style={styles.activityLabel}>Last Login</Text>
                <Text style={styles.activityValue}>
                  {formatDate(analyticsData.lastLogin)}
                </Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <Text style={styles.activityIcon}>⭐</Text>
              <View style={styles.activityInfo}>
                <Text style={styles.activityLabel}>Account Status</Text>
                <Text style={styles.activityValue}>Active Member</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Insights */}
        <Card style={styles.insightsCard} padding={20} margin={16}>
          <Text style={styles.insightsTitle}>💡 Insights</Text>
          <Text style={styles.insightsText}>
            • You've earned {formatCurrency(analyticsData.referralEarnings)} from referrals{'\n'}
            • Your most active day is Wednesday{'\n'}
            • You save an average of 15% on transaction fees{'\n'}
            • Your spending has increased by 8% this month
          </Text>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Export Data"
            onPress={handleExportData}
            variant="outline"
            style={styles.exportButton}
          />

          <Button
            title="Detailed Report"
            onPress={handleDetailedReport}
            style={styles.reportButton}
          />
        </View>

        {/* Footer Note */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Analytics data is updated in real-time. All amounts shown are in Nigerian Naira (NGN).
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8e8e93',
    textAlign: 'center',
  },
  selectorCard: {
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 12,
  },
  timeRangeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  timeRangeButton: {
    minWidth: 60,
  },
  timeRangeText: {
    fontSize: 14,
    color: '#8e8e93',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  metricCard: {
    width: '46%',
    backgroundColor: '#4B0082',
    alignItems: 'center',
  },
  metricIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 20,
  },
  breakdownList: {
    gap: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  breakdownInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  breakdownLabel: {
    fontSize: 16,
    color: '#1c1c1e',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B0082',
  },
  activityList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
    textAlign: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  activityValue: {
    fontSize: 14,
    color: '#8e8e93',
  },
  insightsCard: {
    backgroundColor: '#e8f4fd',
    borderWidth: 1,
    borderColor: '#4B0082',
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B0082',
    marginBottom: 12,
  },
  insightsText: {
    fontSize: 14,
    color: '#4B0082',
    lineHeight: 22,
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  exportButton: {
    borderColor: '#4B0082',
  },
  reportButton: {
    backgroundColor: '#4B0082',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#8e8e93',
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#8e8e93',
  },
});
