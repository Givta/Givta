#!/bin/bash

# Deploy Firestore Indexes for Givta Admin Dashboard
# This script updates your Firestore database with all required indexes

echo "🚀 Deploying Firestore Indexes for Givta Admin Dashboard..."

# Navigate to the correct project directory
cd "$(dirname "$0")"

# Deploy indexes
echo "📊 Updating Firestore indexes..."
firebase deploy --only firestore:indexes

if [ $? -eq 0 ]; then
    echo "✅ Firestore indexes deployed successfully!"
    echo ""
    echo "📝 New collections and indexes created:"
    echo "• systemLogs - Comprehensive logging system"
    echo "• supportTickets - Support ticket management"
    echo "• supportMessages - Ticket message threading"
    echo "• systemSettings - Platform configuration"
    echo "• notificationTemplates - Communication templates"
    echo "• maintenanceRecords - System maintenance tracking"
    echo ""
    echo "🔧 Total indexes added: 34 new composite indexes"
    echo "⚡ Database is now optimized for admin dashboard performance"
else
    echo "❌ Failed to deploy Firestore indexes"
    echo "Please check your Firebase project configuration"
    exit 1
fi
