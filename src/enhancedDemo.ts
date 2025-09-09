import { NudgeEngine } from './nudgeEngine';
import { SessionContext, UserProfile } from './types';

export type ProfileType = 'budget-family' | 'health-fitness' | 'convenience-professional';

export interface EnhancedUserProfile extends UserProfile {
  profileType: ProfileType;
  displayName: string;
  description: string;
  traits: string[];
}

export const USER_PROFILES: Record<ProfileType, EnhancedUserProfile> = {
  'budget-family': {
    id: 'budget-family-shopper',
    profileType: 'budget-family',
    displayName: 'Budget-conscious Family Shopper',
    description: 'Weekly shop, large household, prefers multi-buy deals, price sensitive',
    traits: ['Weekly shopping trips', 'Large household', 'Multi-buy deals', 'Price sensitive', 'Bulk purchases'],
    dietTags: [],
    avoidBrands: [],
    valueBias: 'value',
    budgetBand: 'low',
    allergyProfile: []
  },
  'health-fitness': {
    id: 'health-fitness-enthusiast',
    profileType: 'health-fitness',
    displayName: 'Health & Fitness Enthusiast',
    description: 'Active lifestyle, prefers high-protein and low-sugar products, spends more on nutritional items',
    traits: ['Active lifestyle', 'High-protein preference', 'Low-sugar focus', 'Nutrition conscious', 'Premium health products'],
    dietTags: [],
    avoidBrands: [],
    valueBias: 'premium',
    budgetBand: 'high',
    allergyProfile: []
  },
  'convenience-professional': {
    id: 'convenience-professional',
    profileType: 'convenience-professional',
    displayName: 'Convenience-driven Young Professional',
    description: 'Small basket, frequent top-up shops, values ready-to-eat and quick-prep meals',
    traits: ['Small basket size', 'Frequent shopping', 'Quick preparation', 'Ready-to-eat meals', 'Time-conscious'],
    dietTags: [],
    avoidBrands: [],
    valueBias: 'balanced',
    budgetBand: 'mid',
    allergyProfile: []
  }
};

export interface NudgeScenario {
  triggerProduct: string;
  nudgeType: string;
  title: string;
  reason: string;
  recommendedProducts: string[];
  savings: number;
  ctaText: {
    primary: string;
    secondary: string;
  };
  persuasiveCopy: {
    headline: string;
    subtext: string;
    urgency?: string;
  };
}

export const PROFILE_SCENARIOS: Record<ProfileType, NudgeScenario[]> = {
  'budget-family': [
    {
      triggerProduct: 'milk-2l',
      nudgeType: 'family-optimizer',
      title: '💰 Family-Size Optimizer',
      reason: 'Families like yours save £0.40 by choosing the 4L option. Less shopping trips, more family time!',
      recommendedProducts: ['milk-4l'],
      savings: 0.40,
      ctaText: { primary: 'Swap to 4L', secondary: 'Keep 2L' },
      persuasiveCopy: {
        headline: 'Smart families choose bigger',
        subtext: 'Save money and reduce weekly shopping trips',
        urgency: '40p savings - every penny counts!'
      }
    },
    {
      triggerProduct: 'bread-2for2',
      nudgeType: 'multibuy-completion',
      title: '🎯 Complete Your Deal',
      reason: 'Budget-conscious shoppers never miss a deal! Add another loaf to unlock 60p savings for your family.',
      recommendedProducts: ['bread-2for2'],
      savings: 0.60,
      ctaText: { primary: 'Complete Deal', secondary: 'Just one loaf' },
      persuasiveCopy: {
        headline: 'You\'re halfway to savings',
        subtext: 'Complete the family deal and save 60p',
        urgency: 'Multi-buy deals end today!'
      }
    }
  ],
  'health-fitness': [
    {
      triggerProduct: 'greek-yogurt-500g',
      nudgeType: 'protein-complement',
      title: '💪 Performance Pairing',
      reason: 'Maximize your protein intake! This high-protein granola contains 25g protein per serving - perfect for your active lifestyle.',
      recommendedProducts: ['protein-granola-400g'],
      savings: 0.50,
      ctaText: { primary: 'Power Up', secondary: 'Skip' },
      persuasiveCopy: {
        headline: 'Fuel your performance',
        subtext: 'Complete protein breakfast = better workouts',
        urgency: 'Intro price - serious athletes act fast!'
      }
    },
    {
      triggerProduct: 'energy-bar-regular',
      nudgeType: 'better-fit-substitute',
      title: '🎯 Fitness Upgrade',
      reason: 'Level up your nutrition! This bar has 40% more protein and 60% less sugar - perfect for your fitness goals.',
      recommendedProducts: ['protein-bar-lowsugar'],
      savings: 0,
      ctaText: { primary: 'Upgrade Fuel', secondary: 'Keep current' },
      persuasiveCopy: {
        headline: 'Upgrade your fuel',
        subtext: 'More protein, less sugar = better results',
        urgency: 'Train smarter, not harder!'
      }
    }
  ],
  'convenience-professional': [
    {
      triggerProduct: 'ready-meal-curry',
      nudgeType: 'meal-completion',
      title: '⚡ Instant Dinner Solution',
      reason: 'Busy professionals deserve complete meals! Add this 90-second rice to avoid the hassle of cooking sides.',
      recommendedProducts: ['microwave-rice'],
      savings: 0,
      ctaText: { primary: 'Complete Meal', secondary: 'Just curry' },
      persuasiveCopy: {
        headline: 'Dinner sorted in 90 seconds',
        subtext: 'No prep, no cleanup, no stress',
        urgency: 'Perfect for your busy schedule!'
      }
    },
    {
      triggerProduct: 'wine-bottle',
      nudgeType: 'occasion-upgrade',
      title: '🍕 Weekend Treat',
      reason: 'You\'ve earned this! Professionals who work hard deserve the perfect Friday night combo.',
      recommendedProducts: ['deli-pizza'],
      savings: 0,
      ctaText: { primary: 'Treat Yourself', secondary: 'Just wine' },
      persuasiveCopy: {
        headline: 'Your night-in awaits',
        subtext: 'Wine + pizza = weekend perfection',
        urgency: 'You deserve this after a long week!'
      }
    }
  ]
};

export function createEnhancedDemo(profileType: ProfileType = 'budget-family') {
  const engine = new NudgeEngine();
  const session: SessionContext = { basket: [], scans: [], nudgeHistory: [] };
  const user = USER_PROFILES[profileType];

  return { engine, session, user, scenarios: PROFILE_SCENARIOS[profileType] };
}