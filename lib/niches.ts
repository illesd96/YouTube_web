export type NicheTag = string;

export interface NicheDefinition {
  name: string;
  keywords: string[];
}

export const NICHES: NicheDefinition[] = [
  {
    name: 'Luxury Houses / Real Estate',
    keywords: [
      'luxury home', 'luxury house', 'mansion', 'villa', 'penthouse',
      'estate tour', 'house tour', 'property tour', 'architectural digest',
      'real estate', 'dream home', 'modern house', 'interior design',
      'architecture tour', 'luxury property', 'luxury estate', 'luxury real estate',
      'luxury residence', 'million dollar', 'expensive house', 'expensive home',
      'luxury apartment', 'luxury condo', 'waterfront property', 'beachfront',
      'luxury listing', 'property showcase', 'home design', 'luxury interior'
    ],
  },
  {
    name: 'Engineering',
    keywords: [
      'engineering', 'mechanical', 'electrical', 'civil engineering',
      'structural', 'cad', 'solidworks', 'autocad', 'robotics', 'cnc',
      'manufacturing', 'aerospace', 'automation', 'control systems',
      'thermodynamics'
    ],
  },
  {
    name: 'Pets',
    keywords: [
      'dog', 'puppy', 'cat', 'kitten', 'pet', 'pets', 'training', 'vet',
      'grooming', 'rescue', 'hamster', 'parrot', 'aquarium'
    ],
  },
  {
    name: 'Court / Law',
    keywords: [
      'court', 'trial', 'judge', 'lawsuit', 'legal', 'attorney', 'lawyer',
      'prosecutor', 'verdict', 'sentencing', 'supreme court'
    ],
  },
  {
    name: 'Luxury (General)',
    keywords: [
      'luxury', 'premium', 'high end', 'exclusive', 'bespoke',
      'limited edition', 'collector', 'luxury lifestyle', 'ultra luxury',
      'luxury living', 'opulent', 'extravagant', 'lavish', 'prestige'
    ],
  },
  {
    name: 'Luxury Women Clothing & Accessories',
    keywords: [
      'chanel', 'hermes', 'dior', 'louis vuitton', 'lv', 'gucci', 'prada',
      'ysl', 'balenciaga', 'fendi', 'burberry', 'handbag', 'purse', 'heels',
      'jewelry', 'accessories', 'luxury fashion', 'unboxing'
    ],
  },
  {
    name: 'Stock Market / Investing',
    keywords: [
      'stock', 'stocks', 'options', 'earnings', 'nasdaq', 'nyse', 'sp500',
      'etf', 'investing', 'trading', 'technical analysis', 'dividends'
    ],
  },
  {
    name: 'Business',
    keywords: [
      'business', 'entrepreneur', 'startup', 'founder', 'saas', 'marketing',
      'sales', 'strategy', 'leadership', 'side hustle'
    ],
  },
  {
    name: 'Travel',
    keywords: [
      'travel', 'trip', 'guide', 'hotel', 'resort', 'itinerary', 'vlog',
      'city tour', 'luxury travel'
    ],
  },
  {
    name: 'Automobiles',
    keywords: [
      'car', 'automotive', 'test drive', 'review', 'supercar', 'hypercar',
      'suv', 'sedan'
    ],
  },
  {
    name: 'Electric Vehicles',
    keywords: [
      'ev', 'electric vehicle', 'tesla', 'rivian', 'lucid', 'charging',
      'battery', 'range test'
    ],
  },
  {
    name: 'Website / SaaS Reviews',
    keywords: [
      'website review', 'ux', 'ui', 'landing page', 'audit', 'figma',
      'webflow', 'shopify', 'wordpress'
    ],
  },
  {
    name: 'Make Money Online',
    keywords: [
      'make money online', 'mmo', 'affiliate', 'dropshipping', 'amazon fba',
      'freelancing', 'passive income'
    ],
  },
  {
    name: 'Yachts',
    keywords: [
      'yacht', 'superyacht', 'mega yacht', 'catamaran', 'sailing yacht',
      'marina'
    ],
  },
  {
    name: 'Tech',
    keywords: [
      'tech', 'gadgets', 'smartphone', 'laptop', 'cpu', 'gpu', 'ai',
      'chatgpt', 'programming', 'software'
    ],
  },
  {
    name: 'Economy / Macro',
    keywords: [
      'inflation', 'interest rates', 'fed', 'ecb', 'recession', 'gdp',
      'bonds', 'oil price', 'forex'
    ],
  },
  {
    name: 'History',
    keywords: [
      'history', 'ancient', 'medieval', 'ww2', 'roman', 'egypt',
      'documentary'
    ],
  },
  {
    name: 'Football (Soccer)',
    keywords: [
      'football', 'soccer', 'premier league', 'champions league', 'la liga',
      'bundesliga', 'world cup'
    ],
  },
  {
    name: 'High-Paying Meta Tags',
    keywords: [
      'finance', 'mortgage', 'insurance', 'tax', 'cloud', 'aws', 'azure',
      'cybersecurity', 'real estate', 'legal', 'luxury'
    ],
  },
];

/**
 * Normalizes text for niche matching:
 * - Lowercase
 * - Strip punctuation (keep spaces, letters, numbers)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Classifies a video into zero or more niches based on title and channel title
 */
export function classifyNiches(title: string, channelTitle: string): NicheTag[] {
  const combinedText = normalizeText(`${title} ${channelTitle}`);
  const matchedNiches: NicheTag[] = [];

  for (const niche of NICHES) {
    const hasMatch = niche.keywords.some((keyword) => {
      const normalizedKeyword = normalizeText(keyword);
      return combinedText.includes(normalizedKeyword);
    });

    if (hasMatch) {
      matchedNiches.push(niche.name);
    }
  }

  return matchedNiches;
}
