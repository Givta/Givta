// Challenge templates that users can select from when creating challenges
export interface ChallengeTemplate {
  id: string;
  name: string;
  icon: string;
  category: 'competition' | 'celebration' | 'sponsored';
  description: string;
  goalType: 'amount' | 'participants' | 'days';

  // Enhanced content fields
  rules: string[];
  howToPlay: string;
  winnings: string;

  // Template defaults
  defaultAmount?: number;
  defaultParticipants?: number;
  minParticipants?: number; // NEW: Minimum participants required
  defaultDuration: number; // in days

  // Participation settings - NEW
  participationFee?: number; // Fee to join (charged to participants)
  requiresPreFunding?: boolean; // Sponsor must pre-fund prizes

  // Reward settings
  rewardPercentage?: number;
  prizeSplit?: { [rank: number]: number };

  // UI settings
  primaryColor: string;
  secondaryColor: string;

  // Content templates
  suggestedTitles: string[];
  defaultMessage: string;
  hashtags: string[];

  // Social media assets
  emoji: string;
  callToAction: string;
}

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  // ===== CELEBRATION CHALLENGES =====
  {
    id: 'birthday-bash',
    name: 'Birthday Bash',
    icon: 'party',
    category: 'celebration',
    description: 'Celebrate your birthday with friends and family tipping!',
    goalType: 'amount',
    rules: [
      'Everyone can participate by sending tips',
      'Minimum tip amount is ₦100',
      'Tips directly contribute to your birthday fund',
      'Challenge ends when goal amount is reached or time expires',
      'Givta takes 5% platform fee from total collected',
      'Prize will be transferred to your wallet automatically'
    ],
    howToPlay: 'Create your birthday challenge with a target amount. Share the challenge link with friends and family. Every tip they send brings you closer to your goal! Once the challenge ends, you\'ll receive the prize money in your Givta wallet minus the platform fee.',
    winnings: 'You keep 95% of all tips collected after deducting the ₦100 participation fee per tip. For example, if you collect ₦50,000 with 500 participants, you\'ll receive ₦47,500 in your wallet.',
    defaultAmount: 50000,
    defaultDuration: 7,
    rewardPercentage: 5,
    primaryColor: '#FF6B6B',
    secondaryColor: '#FFEAA7',
    emoji: '🎂',
    callToAction: 'Wish a Happy Birthday! 🎉',
    suggestedTitles: [
      'Birthday Celebration! 🎂',
      '🎉 My Birthday Bash!',
      'Birthday Goals! 🎂',
      'Party Time! 🎉'
    ],
    defaultMessage: "Help me make my birthday unforgettable! Every tip gets us closer to epic celebrations. 🎂🎉",
    hashtags: ['BirthdayGoals', 'TippingChallenge', 'Celebration']
  },

  {
    id: 'graduation-glow',
    name: 'Graduation Glow',
    icon: 'graduation',
    category: 'celebration',
    description: 'Celebrate your academic achievement with style!',
    goalType: 'amount',
    rules: [
      'Open to all friends, family, and well-wishers',
      'Minimum tip amount is ₦100',
      'All tips contribute to your graduation celebration fund',
      'Challenge completes when target amount is reached or deadline passes',
      'Givta platform fee is 5% of total collected',
      'Prize distribution happens automatically to your wallet'
    ],
    howToPlay: 'Set your graduation celebration goal amount and share with your network. Every tip brings you closer to celebrating your achievement! After the challenge ends, keep 95% of all money collected in your Givta wallet.',
    winnings: 'You receive 95% of the total tips collected (after Givta\'s 5% fee and ₦100 per tip fee). For example, with ₦75,000 goal and 750 participants paying ₦100 each, you\'ll receive ₦71,250.',
    defaultAmount: 75000,
    defaultDuration: 14,
    rewardPercentage: 5,
    primaryColor: '#4B0082',
    secondaryColor: '#F0E6FF',
    emoji: '🎓',
    callToAction: 'Congratulations! 🎓',
    suggestedTitles: [
      'Class of 2025! 🎓',
      'Graduation Celebration 🎓',
      'Achievement Unlocked! 🎓'
    ],
    defaultMessage: "This is what graduation dreams are made of! Help make my celebration EPIC. 🎓✨",
    hashtags: ['GraduationGoals', 'AchievementUnlocked', 'ClassOf25']
  },

  {
    id: 'anniversary-love',
    name: 'Anniversary Celebration',
    icon: 'heart',
    category: 'celebration',
    description: 'Celebrate your relationship milestone!',
    goalType: 'amount',
    rules: [
      'Open participation for couples and relationship celebrations',
      'Minimum tip amount is ₦100',
      'Tips go directly towards your anniversary celebration fund',
      'Challenge completes on goal achievement or deadline expiration',
      '5% Givta platform fee applied to total collected',
      'Automatic prize distribution to challenge creator\'s wallet'
    ],
    howToPlay: 'Set your anniversary celebration target and share with loved ones. Each tip brings you closer to making your milestone unforgettable! When the challenge finishes, you keep 95% of all funds collected.',
    winnings: 'You receive 95% of all tips collected (minus ₦100 per tip fee). For example, collecting ₦100,000 with 1,000 participants would give you ₦95,000 to celebrate your love.',
    defaultAmount: 100000,
    defaultDuration: 30,
    rewardPercentage: 5,
    primaryColor: '#FF1744',
    secondaryColor: '#FFC4D1',
    emoji: '💑',
    callToAction: 'Love Anniversary! ❤️',
    suggestedTitles: [
      'Love Anniversary! 💑',
      'Celebrating Love! 💑',
      'Our Special Day! 💑'
    ],
    defaultMessage: "A year of love deserves a celebration! Help us celebrate our special anniversary. 💑❤️",
    hashtags: ['AnniversaryGoals', 'LoveCelebration', 'Forever']
  },

  // ===== MORE COMPETITION CHALLENGES =====
  {
    id: 'fitness-challenge',
    name: 'Fitness Battle 💪',
    icon: 'dumbbell',
    category: 'competition',
    description: 'Compete for the ultimate fitness champion title!',
    goalType: 'participants',
    rules: [
      'Minimum 3 fitness enthusiasts must compete',
      'Each competitor pays ₦200 entry fee to participate',
      'Supporters tip their favorite competitor to vote',
      'Competitor with highest total tips wins championship',
      '30-day fitness transformation period',
      'Prize split: 60% to champion, 30% to 2nd, 10% to 3rd place'
    ],
    howToPlay: 'Invite fitness competitors to join your challenge and share their transformation journeys. Each competitor pays ₦200 to enter. Fans and supporters tip their favorites, with the highest tipped participant winning the championship crown and prize money!',
    winnings: 'From each ₦200 entry: Champion gets ₦120 (60%), 2nd place gets ₦60 (30%), 3rd gets ₦20 (10%). With 20 competitors, you create a ₦40,000 prize pool across 3 winners.',
    defaultParticipants: 20,
    minParticipants: 3,
    defaultDuration: 30,
    participationFee: 200,
    prizeSplit: { 1: 60, 2: 30, 3: 10 },
    primaryColor: '#4CAF50',
    secondaryColor: '#A5D6A7',
    emoji: '💪',
    callToAction: 'Fitness Championship! 💪',
    suggestedTitles: [
      'Fitness Championship! 💪',
      'Transformation Battle! 💪',
      'Fitness Warriors! 💪'
    ],
    defaultMessage: "Who will be crowned the ultimate fitness champion? Vote with your tips! 💪🏆",
    hashtags: ['FitnessChampionship', 'TransformationBattle', 'FitnessWarriors']
  },

  {
    id: 'lifestyle-challenge',
    name: 'Lifestyle Showdown 🌟',
    icon: 'star',
    category: 'competition',
    description: 'Battle for the crown of best lifestyle transformation!',
    goalType: 'participants',
    rules: [
      'At least 3 lifestyle competitors required',
      '₦150 entry fee per competitor',
      'Fans vote by tipping their favorite lifestyle transformer',
      'Highest tips determine the lifestyle champion',
      '21-day lifestyle improvement challenge',
      'Prizes: 55% to winner, 30% to 2nd, 15% to 3rd'
    ],
    howToPlay: 'Organize a lifestyle transformation competition where participants share their personal growth journeys. Each competitor pays ₦150 to enter. Supporters tip the most inspirational transformations, crowning the lifestyle champion at the end!',
    winnings: 'From each ₦150 entry: Winner takes ₦82.50 (55%), 2nd gets ₦45 (30%), 3rd gets ₦22.50 (15%). With 25 participants, you build a ₦37,500 prize pool distributed to your top 3 winners.',
    defaultParticipants: 25,
    minParticipants: 3,
    defaultDuration: 21,
    participationFee: 150,
    prizeSplit: { 1: 55, 2: 30, 3: 15 },
    primaryColor: '#9C27B0',
    secondaryColor: '#E1BEE7',
    emoji: '🌟',
    callToAction: 'Lifestyle Champion! 🌟',
    suggestedTitles: [
      'Lifestyle Championship! 🌟',
      'Transformation Heroes! 🌟',
      'Life Upgrade Battle! 🌟'
    ],
    defaultMessage: "Who will transform their life the most? Cast your votes with tips! 🌟💫",
    hashtags: ['LifestyleChampionship', 'TransformationHeroes', 'LifeUpgrade']
  },

  {
    id: 'fan-growth-battle',
    name: 'Fan Base Battle 👥',
    icon: 'people',
    category: 'competition',
    description: 'Who can grow their fan base the fastest?',
    goalType: 'participants',
    rules: [
      'Minimum 3 influencers/creators must compete',
      'Each competitor pays ₦100 entry fee',
      'Challenge duration is measured in days',
      'Growth measured by new followers/fans gained',
      'Fans vote by tipping their favorite competitor',
      'Prize split: 50% champion, 30% runner-up, 20% 3rd place'
    ],
    howToPlay: 'Competitors join to see who can gain the most new fans/followers within the challenge timeframe. Each pays ₦100 to enter. Share your journey and encourage your community to tip you to victory! The competitor with most tips wins.',
    winnings: 'Each ₦100 entry creates: 50% to champion (₦50), 30% to 2nd (₦30), 20% to 3rd (₦20). With 50 competitors, you have ₦5,000 total in prize money distributed to 3 winners.',
    defaultParticipants: 50,
    minParticipants: 3,
    defaultDuration: 14,
    participationFee: 100,
    prizeSplit: { 1: 50, 2: 30, 3: 20 },
    primaryColor: '#2196F3',
    secondaryColor: '#BBDEFB',
    emoji: '👥',
    callToAction: 'Fan Growth Challenge! 👥',
    suggestedTitles: [
      'Fan Base Battle! 👥',
      'Growth Warriors! 👥',
      'Follower Frenzy! 👥'
    ],
    defaultMessage: "Who will dominate the fan growth contest? Vote with tips and help your favorite win! 👥📈",
    hashtags: ['FanGrowthBattle', 'GrowthWarriors', 'FollowerFrenzy']
  },

  {
    id: 'tip-raising-competition',
    name: 'Tip Raising Showdown 💰',
    icon: 'money',
    category: 'competition',
    description: 'Compete to see who can raise the most tips!',
    goalType: 'participants',
    rules: [
      'At least 3 competitors must participate',
      '₦200 entry fee per competitor',
      'Each competitor sets up their own tip raising campaign',
      'Supporters tip their favorite campaigns',
      'Competitor with highest total tips wins the top prize',
      '7-day intensive tip raising battle',
      'Prize distribution: 60% champion, 30% 2nd, 10% 3rd'
    ],
    howToPlay: 'Tip-raising champions compete to see who can collect the most tips in their personal campaigns. Each competitor pays ₦200 to enter. Choose your favorite and tip generously - the most supported competitor wins the grand prize!',
    winnings: 'From each ₦200 entry: Champion receives ₦120 (60%), 2nd place gets ₦60 (30%), 3rd gets ₦20 (10%). With 30 competitors in a major showdown, you create ₦36,000 total in prize money.',
    defaultParticipants: 30,
    minParticipants: 3,
    defaultDuration: 7,
    participationFee: 200,
    prizeSplit: { 1: 60, 2: 30, 3: 10 },
    primaryColor: '#FF9800',
    secondaryColor: '#FFE0B2',
    emoji: '💰',
    callToAction: 'Tip Raising Battle! 💰',
    suggestedTitles: [
      'Tip Raising War! 💰',
      'Support Showdown! 💰',
      'Money Magnet Battle! 💰'
    ],
    defaultMessage: "Who will emerge as the ultimate tip-raising champion? Support your favorite with generous tips! 💰🏆",
    hashtags: ['TipRaisingWar', 'SupportShowdown', 'MoneyMagnet']
  },

  {
    id: 'talent-showcase',
    name: 'Talent Showcase 🎭',
    icon: 'theater',
    category: 'competition',
    description: 'Show off your talents and compete for stardom!',
    goalType: 'participants',
    rules: [
      'Open to all talented performers and creators',
      'Each talent pays ₦100 entry fee to participate',
      'Public voting through tipping system',
      'Highest tipped performer wins grand prize',
      '10-day talent competition period',
      'Prizes split between top talented performers'
    ],
    howToPlay: 'Welcome all forms of talent - singing, dancing, comedy, poetry, art, etc. Each performer pays ₦100 to enter. Share your talent and encourage supporters to tip generously. The most tipped performer becomes the Talent Champion!',
    winnings: 'Prize split: 50% to talent champion, 30% to runner-up, 20% to 3rd place. With 40 performers at ₦100 each, you create a ₦40,000 talent prize pool distributed among your top talents.',
    defaultParticipants: 40,
    minParticipants: 3,
    defaultDuration: 10,
    participationFee: 100,
    prizeSplit: { 1: 50, 2: 30, 3: 20 },
    primaryColor: '#FF5722',
    secondaryColor: '#FFAB91',
    emoji: '🎭',
    callToAction: 'Talent Competition! 🎭',
    suggestedTitles: [
      'Talent Showcase! 🎭',
      'Star Search! 🎭',
      'Talent Wars! 🎭'
    ],
    defaultMessage: "Lights, camera, talent! Who will be crowned the ultimate performer? Vote with your tips! 🎭⭐",
    hashtags: ['TalentShowcase', 'StarSearch', 'TalentWars']
  },

  // ===== COMPETITION CHALLENGES =====
  {
    id: 'dance-off',
    name: 'Dance Battle 🕺',
    icon: 'dance',
    category: 'competition',
    description: 'Who\'s got the best moves? Let your friends decide!',
    goalType: 'participants',
    rules: [
      'Minimum 3 participants required to start',
      'Each participant pays ₦100 entry fee',
      'Vote by tipping your favorite dancer',
      'Dancer with most tips wins 1st place',
      'Challenge runs for 7 days',
      'Winners: 60% to 1st, 30% to 2nd, 10% to 3rd place'
    ],
    howToPlay: 'Invite dancers to compete by joining your challenge. Each participant pays ₦100 to enter. Voters tip their favorites - highest tips win! Winners split 60% to 1st, 30% to 2nd, 10% to 3rd.',
    winnings: 'Winners share ₦100 from each participant: 1st gets ₦6,000 (60%), 2nd gets ₦3,000 (30%), 3rd gets ₦1,000 (10%). With 50 participants, ₦50,000 prize pool created.',
    defaultParticipants: 50,
    minParticipants: 3, // NEW: Minimum 3 participants required
    defaultDuration: 7,
    participationFee: 100, // NEW: ₦100 fee for Givta
    prizeSplit: { 1: 60, 2: 30, 3: 10 },
    primaryColor: '#9C27B0',
    secondaryColor: '#E1BEE7',
    emoji: '🕺',
    callToAction: 'Dance Competition! 🕺',
    suggestedTitles: [
      'Dance Battle! 🕺',
      'Who Got Moves? 🕺',
      'Dance Challenge! 🕺'
    ],
    defaultMessage: "Dance battle time! Vote for your favorite dancer with tips. 🕺🎶",
    hashtags: ['DanceChallenge', 'DanceBattle', 'GotMoves']
  },

  {
    id: 'cooking-competition',
    name: 'Cooking Contest 👩‍🍳',
    icon: 'chef',
    category: 'competition',
    description: 'May the best chef win! Cook up some competition.',
    goalType: 'participants',
    rules: [
      'Minimum 3 chefs must participate',
      '₦100 entry fee per participant',
      'Tip your favorite chef to vote',
      'Chef with highest tips wins first place',
      '14-day competition period',
      'Prize split: 50% to winner, 30% to 2nd, 20% to 3rd'
    ],
    howToPlay: 'Invite culinary artists to join your cooking competition. Each chef pays ₦100 to participate. Supporters vote by tipping their favorite chef. The highest tipped chef wins the grand prize!',
    winnings: 'Each ₦100 entry creates prize money: 1st place gets ₦5,000 (50%), 2nd gets ₦3,000 (30%), 3rd gets ₦2,000 (20%). With 30 chefs, you have a ₦30,000 culinary prize pool.',
    defaultParticipants: 30,
    minParticipants: 3, // NEW: Minimum 3 participants required
    defaultDuration: 14,
    participationFee: 100, // NEW: ₦100 fee for Givta
    prizeSplit: { 1: 50, 2: 30, 3: 20 },
    primaryColor: '#FF7043',
    secondaryColor: '#FFE0B2',
    emoji: '👩‍🍳',
    callToAction: 'Cooking Competition! 👩‍🍳',
    suggestedTitles: [
      'Cooking Contest! 👩‍🍳',
      'Chef Battle! 👩‍🍳',
      'Culinary Showdown! 👩‍🍳'
    ],
    defaultMessage: "Cooking competition alert! Tip your favorite chef. 👩‍🍳🔥",
    hashtags: ['CookingCompetition', 'ChefBattle', 'KitchenWar']
  },

  {
    id: 'fashion-show',
    name: 'Fashion Show 👗',
    icon: 'dress',
    category: 'competition',
    description: 'Strut your stuff! Fashion contest with prizes.',
    goalType: 'participants',
    rules: [
      'At least 3 fashionistas required',
      '₦100 entry fee for each participant',
      'Vote by tipping the best dressed contestants',
      'Highest tips determine top 4 winners',
      '10-day fashion runway period',
      'Prizes: 40% to 1st, 30% to 2nd, 20% to 3rd, 10% to 4th'
    ],
    howToPlay: 'Organize a fashion show by inviting designers and models to join. Each participant pays ₦100 to strut their stuff. Tip your favorite looks to crown the winners! Top 4 get prizes.',
    winnings: 'From each ₦100 entry: 1st gets ₦4,000 (40%), 2nd gets ₦3,000 (30%), 3rd gets ₦2,000 (20%), 4th gets ₦1,000 (10%). With 40 participants, create a ₦40,000 fashion prize pool.',
    defaultParticipants: 40,
    minParticipants: 3, // NEW: Minimum 3 participants required
    defaultDuration: 10,
    participationFee: 100, // NEW: ₦100 fee for Givta
    prizeSplit: { 1: 40, 2: 30, 3: 20, 4: 10 },
    primaryColor: '#E91E63',
    secondaryColor: '#F8BBD9',
    emoji: '👗',
    callToAction: 'Fashion Show! 👗',
    suggestedTitles: [
      'Fashion Show! 👗',
      'Style Battle! 👗',
      'Runway Ready! 👗'
    ],
    defaultMessage: "Fashion contest coming soon! Vote with your tips for your favorite looks. 👗✨",
    hashtags: ['FashionShow', 'StyleGoals', 'FashionContest']
  },

  // ===== SPONSORED CHALLENGES =====
  {
    id: 'friday-energy',
    name: 'Friday Energy 🔥',
    icon: 'fire',
    category: 'sponsored',
    description: 'Kick off your weekend with energy boosting vibes!',
    goalType: 'amount',
    rules: [
      'Sponsor must pre-fund the prize pool',
      'Participants pay ₦100 to join',
      'Sponsor pre-funds ₦30,000 prize amount',
      'All tips and fees go to participants',
      'Sponsor gets marketing exposure',
      '7-day Friday energy campaign'
    ],
    howToPlay: 'As a sponsor, pre-fund ₦30,000 for prizes. Participants join by paying ₦100 each. You get marketing visibility while participants compete for the sponsored prizes. Perfect for energy drink brands!',
    winnings: 'Participants split the ₦30,000 sponsored prize pool proportionally based on their tip amounts. Sponsors get brand visibility but no financial return - this is pure marketing investment.',
    defaultAmount: 50000,
    defaultDuration: 7,
    participationFee: 100, // NEW: ₦100 fee for Givta
    requiresPreFunding: true, // NEW: Sponsor must pre-fund prizes
    primaryColor: '#FF5722',
    secondaryColor: '#FFAB91',
    emoji: '🔥',
    callToAction: 'Friday Vibes! 🔥',
    suggestedTitles: [
      'Friday Energy! 🔥',
      'Friday Night Fever! 🔥',
      'Weekend Energy! 🔥'
    ],
    defaultMessage: "Get hyped for the weekend! Special sponsored prizes this Friday. 🔥💪",
    hashtags: ['FridayEnergy', 'WeekendVibes', 'FridayNight']
  },

  {
    id: 'weekendboost',
    name: 'Weekend Boost 🚀',
    icon: 'rocket',
    category: 'sponsored',
    description: 'Power up your Saturdays and Sundays!',
    goalType: 'amount',
    rules: [
      'Sponsor pre-funds ₦20,000 prize pool',
      '₦100 participation fee for entrants',
      'Short 2-day weekend promotion',
      'Sponsor gets prime brand placement',
      'All prize money comes from sponsor',
      'Ideal for weekend event sponsors'
    ],
    howToPlay: 'Fund ₦20,000 as a sponsor to create weekend excitement. Participants pay ₦100 to join and compete. Your brand gets weekend visibility through prime placement in the challenge promotion.',
    winnings: 'Participants share the ₦20,000 sponsored pool based on tip performance. Sponsors invest in marketing without expecting financial returns - focus is on brand awareness and weekend engagement.',
    defaultAmount: 20000,
    defaultDuration: 2,
    participationFee: 100, // NEW: ₦100 fee for Givta
    requiresPreFunding: true, // NEW: Sponsor must pre-fund prizes
    primaryColor: '#2196F3',
    secondaryColor: '#BBDEFB',
    emoji: '🚀',
    callToAction: 'Weekend Boost! 🚀',
    suggestedTitles: [
      'Weekend Boost! 🚀',
      'Saturday Power! 🚀',
      'Weekend Momentum! 🚀'
    ],
    defaultMessage: "Launch your weekend with extra energy! Sponsored prizes available. 🚀✨",
    hashtags: ['WeekendBoost', 'SaturdayEnergy', 'WeekendPower']
  }
];

// Helper functions
export function getTemplatesByCategory(category: string): ChallengeTemplate[] {
  return CHALLENGE_TEMPLATES.filter(template => template.category === category);
}

export function getTemplateById(id: string): ChallengeTemplate | undefined {
  return CHALLENGE_TEMPLATES.find(template => template.id === id);
}

export function getAllCategories(): string[] {
  const categories = CHALLENGE_TEMPLATES.map(template => template.category);
  return [...new Set(categories)];
}

export function getSampleTitles(category?: string): string[] {
  if (category) {
    return CHALLENGE_TEMPLATES
      .filter(template => template.category === category)
      .flatMap(template => template.suggestedTitles);
  }
  return CHALLENGE_TEMPLATES.flatMap(template => template.suggestedTitles);
}
