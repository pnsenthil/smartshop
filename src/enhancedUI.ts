import { createEnhancedDemo, ProfileType, USER_PROFILES, PROFILE_SCENARIOS, NudgeScenario } from './enhancedDemo';
import { Catalog } from './catalog';
import { NudgeCandidate } from './types';

export function mountEnhancedUI(root: HTMLElement) {
  let currentProfileType: ProfileType = 'budget-family';
  let { engine, session, user, scenarios } = createEnhancedDemo(currentProfileType);
  let useAI = true;
  let mobileView: 'home' | 'shopping' = 'home'; // Track mobile view state

  root.innerHTML = `
    <div class="container">
      <div class="header">
        <div class="logo"><span class="dot"></span> SmartShop Nudges</div>
        <div style="display:flex; align-items:center; gap:10px;">
          <span class="badge-agentic"><span id="aiStatusDot" class="status-dot status-offline"></span>Agentic: Gemini Re-ranker</span>
          <label style="font-size:12px; color:var(--muted)">Enable
            <input id="aiToggle" type="checkbox" ${useAI ? 'checked' : ''} />
          </label>
          <div class="scan-meta">Throttling: 1 per 3 scans</div>
        </div>
      </div>
      
      <!-- Profile Selector -->
      <div class="profile-selector" id="profile-selector"></div>
      <div class="profile-info" id="profile-info"></div>
      
      <div class="layout">
        <div>
          <div class="nudge-activity">
            <div style="font-weight:700; margin-bottom:8px;">Nudge Activity</div>
            <div id="nudge-activity-log" style="font-size:12px; color:var(--muted)">No nudges yet</div>
          </div>
          <div class="basket" id="basket">
            <div style="font-weight:700; margin-bottom:8px;">Products to Try</div>
            <div id="nudge-trigger-guide" style="font-size:12px; margin-bottom:12px;"></div>
            <div style="font-weight:700; margin-bottom:8px;">Your Basket</div>
            <div id="basket-items" style="font-size:14px; color:var(--muted)">Empty - Select products above to discover smart nudges</div>
          </div>
        </div>
        <div class="phone">
          <div class="phone-notch"></div>
          <div class="phone-screen">
            <div class="phone-content" id="phone-content">
              <!-- Mobile Home Screen -->
              <div id="mobile-home" class="mobile-view">
                <div class="mobile-header">
                  <div class="mobile-app-name">SmartShop</div>
                  <div class="mobile-tagline">Choose your shopping experience</div>
                </div>
                <div class="profile-cards" id="profile-cards"></div>
              </div>
              
              <!-- Mobile Shopping Experience -->
              <div id="mobile-shopping" class="mobile-view" style="display:none;">
                <div class="mobile-header">
                  <div class="mobile-nav">
                    <button id="back-home-btn" class="back-btn">← Back</button>
                    <div class="mobile-app-name">SmartShop</div>
                  </div>
                  <div class="mobile-profile-badge" id="mobile-profile-badge"></div>
                </div>
                
                <div class="mobile-products">
                  <div class="mobile-products-title">
                    🛍️ Shop Products
                    <span style="font-size:10px; color:var(--muted); margin-left:auto;" id="product-count">0 products</span>
                  </div>
                  <div class="mobile-products-grid" id="mobile-products-grid"></div>
                </div>
                
                <div class="phone-card">
                  <h3>Basket</h3>
                  <div id="phone-basket"></div>
                  <div class="basket-total"><span>Total</span><span id="phone-total">£0.00</span></div>
                  <button id="checkout-btn" class="checkout-btn" style="display:none;">Proceed to Checkout</button>
                </div>
              </div>
            </div>
            <div id="nudge" class="nudge-sheet" aria-live="polite"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Get DOM elements
  const profileSelector = document.getElementById('profile-selector')!;
  const profileInfo = document.getElementById('profile-info')!;
  const mobileProductsGrid = document.getElementById('mobile-products-grid')!;
  const productCount = document.getElementById('product-count')!;
  const nudgeContainer = document.getElementById('nudge')!;
  const basketEl = document.getElementById('basket-items')!;
  const aiToggle = document.getElementById('aiToggle') as HTMLInputElement;
  const phoneBasket = document.getElementById('phone-basket')!;
  const phoneTotal = document.getElementById('phone-total')!;
  const nudgeTriggerGuide = document.getElementById('nudge-trigger-guide')!;
  const activityLog = document.getElementById('nudge-activity-log')!;
  const aiStatusDot = document.getElementById('aiStatusDot') as HTMLSpanElement;
  const checkoutBtn = document.getElementById('checkout-btn')! as HTMLButtonElement;
  
  // Mobile navigation elements
  const mobileHome = document.getElementById('mobile-home')!;
  const mobileShopping = document.getElementById('mobile-shopping')!;
  const profileCards = document.getElementById('profile-cards')!;
  const backHomeBtn = document.getElementById('back-home-btn')!;
  const mobileProfileBadge = document.getElementById('mobile-profile-badge')!;

  aiToggle?.addEventListener('change', () => { useAI = !!aiToggle.checked; });
  checkoutBtn?.addEventListener('click', () => showCheckoutSummary());
  backHomeBtn?.addEventListener('click', () => showMobileHome());

  // Create profile selector buttons
  function renderProfileSelector() {
    profileSelector.innerHTML = '';
    Object.entries(USER_PROFILES).forEach(([key, profile]) => {
      const btn = document.createElement('button');
      btn.className = `profile-btn ${key === currentProfileType ? 'active' : ''}`;
      btn.textContent = profile.displayName;
      btn.onclick = () => switchProfile(key as ProfileType);
      profileSelector.appendChild(btn);
    });
  }

  // Render profile info
  function renderProfileInfo() {
    const profile = USER_PROFILES[currentProfileType];
    profileInfo.innerHTML = `
      <div class="profile-name">${profile.displayName}</div>
      <div class="profile-description">${profile.description}</div>
      <div class="profile-traits">
        ${profile.traits.map(trait => `<span class="trait-tag">${trait}</span>`).join('')}
      </div>
    `;
  }

  // Render nudge trigger guide
  function renderNudgeTriggerGuide() {
    const profile = USER_PROFILES[currentProfileType];
    const profileEmojis: Record<string, string> = {
      'budget-family': '💰',
      'health-fitness': '💪',
      'convenience-professional': '⚡'
    };
    
    const triggers = scenarios.map(scenario => {
      const triggerProduct = Catalog[scenario.triggerProduct];
      if (!triggerProduct) return '';
      
      return `<div style="margin-bottom:8px; padding:8px 10px; background:rgba(255,121,0,0.08); border-radius:10px; border:1px solid rgba(255,121,0,0.15); cursor:pointer;" onclick="document.querySelector('[data-product=\\"${scenario.triggerProduct}\\"]')?.click()">
        <div style="font-weight:700; color:var(--brand-navy); font-size:12px; margin-bottom:2px;">📱 ${triggerProduct.name} <span style="color:var(--brand-orange); font-size:9px;">(Top of mobile)</span></div>
        <div style="color:var(--brand-orange); font-size:10px; font-weight:600; text-transform:uppercase;">${scenario.title}</div>
        <div style="color:var(--muted); font-size:10px; margin-top:2px;">${scenario.persuasiveCopy.headline}</div>
      </div>`;
    }).filter(item => item !== '').join('');

    const profileEmoji = profileEmojis[currentProfileType] || '🛒';
    nudgeTriggerGuide.innerHTML = triggers ? 
      `<div style="font-weight:700; color:var(--brand-navy); margin-bottom:10px; font-size:12px;">${profileEmoji} ${profile.displayName} - Try these products:</div>${triggers}` : 
      '';
  }

  // Mobile navigation functions
  function showMobileHome() {
    mobileView = 'home';
    mobileHome.style.display = 'block';
    mobileShopping.style.display = 'none';
    
    // Reset session when going back to home
    session.basket = [];
    session.scans = [];
    session.nudgeHistory = [];
    renderBasket();
    
    // Hide any open nudges
    nudgeContainer.classList.remove('open');
    nudgeContainer.innerHTML = '';
    
    // Clear activity log
    activityLog.textContent = 'No nudges yet';
  }

  function showMobileShopping(profileType: ProfileType) {
    mobileView = 'shopping';
    currentProfileType = profileType;
    
    // Switch to the selected profile
    const newDemo = createEnhancedDemo(profileType);
    engine = newDemo.engine;
    session = newDemo.session;
    user = newDemo.user;
    scenarios = newDemo.scenarios;
    
    // Update mobile profile badge
    const profile = USER_PROFILES[profileType];
    const profileEmojis: Record<string, string> = {
      'budget-family': '💰',
      'health-fitness': '💪',
      'convenience-professional': '⚡'
    };
    mobileProfileBadge.innerHTML = `${profileEmojis[profileType]} ${profile.displayName}`;
    
    // Show shopping view
    mobileHome.style.display = 'none';
    mobileShopping.style.display = 'block';
    
    // Update desktop view as well
    renderProfileSelector();
    renderProfileInfo();
    renderNudgeTriggerGuide();
    renderMobileProducts();
    renderBasket();
  }

  // Render mobile profile cards
  function renderMobileProfileCards() {
    const profileData = [
      {
        type: 'budget-family' as ProfileType,
        name: 'Sarah Johnson',
        category: 'FamilySaver',
        headshot: '👩',
        color: '#1f8f4e'
      },
      {
        type: 'health-fitness' as ProfileType,
        name: 'Mike Chen',
        category: 'ActiveEats',
        headshot: '👨',
        color: '#3949ab'
      },
      {
        type: 'convenience-professional' as ProfileType,
        name: 'Emma Davis',
        category: 'TimeSaver',
        headshot: '👩‍💼',
        color: '#e86b00'
      }
    ];

    profileCards.innerHTML = profileData.map(profile => `
      <div class="profile-card-clean" onclick="selectMobileProfile('${profile.type}')">
        <div class="profile-headshot">${profile.headshot}</div>
        <div class="profile-name">${profile.name}</div>
        <div class="profile-category" style="color: ${profile.color};">${profile.category}</div>
      </div>
    `).join('');
  }

  // Global function for profile selection (called from HTML)
  (window as any).selectMobileProfile = (profileType: ProfileType) => {
    showMobileShopping(profileType);
  };

  // Switch profile
  function switchProfile(profileType: ProfileType) {
    currentProfileType = profileType;
    const newDemo = createEnhancedDemo(profileType);
    engine = newDemo.engine;
    session = newDemo.session;
    user = newDemo.user;
    scenarios = newDemo.scenarios;
    
    renderProfileSelector();
    renderProfileInfo();
    renderNudgeTriggerGuide();
    renderBasket();
    renderMobileProducts();
    
    // Clear activity log
    activityLog.textContent = 'No nudges yet';
    // Hide any open nudges
    nudgeContainer.classList.remove('open');
    nudgeContainer.innerHTML = '';
  }

  // Render basket
  function renderBasket() {
    if (session.basket.length === 0) { 
      basketEl.textContent = 'Empty - Select products above to discover smart nudges'; 
      phoneBasket.innerHTML = '<div class="empty-basket">Your basket is empty</div>';
      phoneTotal.textContent = '£0.00';
      checkoutBtn.style.display = 'none';
      return; 
    }
    
    basketEl.innerHTML = '';
    phoneBasket.innerHTML = '';
    let total = 0;
    
    for (const item of session.basket) {
      const p = Catalog[item.sku];
      if (!p) continue;
      
      const row = document.createElement('div');
      row.textContent = `${p.name} × ${item.qty}`;
      basketEl.appendChild(row);

      const prow = document.createElement('div');
      prow.className = 'basket-row';
      prow.innerHTML = `<span>${p.name}</span><span class="qty-badge">× ${item.qty}</span>`;
      phoneBasket.appendChild(prow);
      total += p.price * item.qty;
    }
    phoneTotal.textContent = `£${total.toFixed(2)}`;
    checkoutBtn.style.display = 'block';
  }

  // Render mobile products - prioritize trigger products first
  function renderMobileProducts() {
    mobileProductsGrid.innerHTML = '';
    
    // Get trigger products for current profile (these go first)
    const triggerSkus = scenarios.map(s => s.triggerProduct);
    const triggerProducts = triggerSkus
      .map(sku => Catalog[sku])
      .filter(p => p); // Remove any undefined products
    
    // Get remaining products (excluding triggers) - reduced count for better nudge visibility
    const remainingProducts = Object.values(Catalog)
      .filter(p => !triggerSkus.includes(p.sku))
      .slice(0, 8); // Reduced to 8 to make nudges more visible
    
    // Combine: trigger products first, then others (total ~10 products)
    const allProducts = [...triggerProducts, ...remainingProducts];
    
    productCount.textContent = `${allProducts.length} products`;
    
    for (let i = 0; i < allProducts.length; i++) {
      const p = allProducts[i];
      const card = document.createElement('div');
      card.className = 'mobile-product-card';
      card.setAttribute('data-product', p.sku);
      
      // Add subtle visual hint for trigger products (first few items)
      const isTriggerProduct = triggerSkus.includes(p.sku);
      if (isTriggerProduct) {
        card.style.boxShadow = '0 2px 8px rgba(255, 121, 0, 0.08)';
        card.style.borderColor = 'rgba(255, 121, 0, 0.2)';
      }
      
      card.innerHTML = `
        <div class="mobile-product-name">${p.name}</div>
        <div class="mobile-product-price">£${p.price.toFixed(2)}</div>
      `;
      
      card.onclick = () => handleScan(p.sku);
      mobileProductsGrid.appendChild(card);
    }
  }

  // Handle product scan (now shows nudge without auto-adding to basket)
  function handleScan(sku: string) {
    // Check for matching scenarios first (show nudge without adding to basket)
    const matchingScenario = scenarios.find(s => s.triggerProduct === sku);
    if (matchingScenario) {
      const customNudge = createCustomNudge(matchingScenario);
      showEnhancedNudge(customNudge, matchingScenario, sku);
      return;
    }

    // For non-scenario products, add to basket directly
    const existing = session.basket.find(b => b.sku === sku);
    if (existing) existing.qty += 1;
    else session.basket.push({ sku, qty: 1 });
    renderBasket();

    // Fall back to regular engine for other nudges
    if (useAI) {
      engine.processScanAI(session, user, { sku, timestamp: Date.now() })
        .then(nudge => { if (nudge) showNudge(nudge); });
    } else {
      const nudge = engine.processScan(session, user, { sku, timestamp: Date.now() });
      if (nudge) showNudge(nudge);
    }
  }

  // Create custom nudge from scenario
  function createCustomNudge(scenario: NudgeScenario): NudgeCandidate {
    const products = scenario.recommendedProducts
      .map(sku => Catalog[sku])
      .filter(p => p);

    return {
      id: `custom-${scenario.nudgeType}-${Date.now()}`,
      type: scenario.nudgeType as any,
      title: scenario.title,
      reason: scenario.reason,
      products: products,
      savings: scenario.savings,
      score: 1.0
    };
  }

  // Show enhanced nudge with persuasive copy
  function showEnhancedNudge(nudge: NudgeCandidate, scenario: NudgeScenario, triggerSku?: string) {
    updateActivityLog(nudge);

    const savingsText = nudge.savings > 0 ? `Save £${nudge.savings.toFixed(2)}` : '';
    const typeEmoji = getTypeEmoji(scenario.nudgeType);
    
    nudgeContainer.setAttribute('role', 'dialog');
    nudgeContainer.setAttribute('aria-label', `${nudge.title}. ${nudge.reason}. ${savingsText}`);
    
    nudgeContainer.innerHTML = `
      <div class="nudge-header">
        <div class="nudge-type-indicator">${typeEmoji}</div>
        <div class="nudge-headline">${scenario.persuasiveCopy.headline}</div>
        <div class="nudge-title">${scenario.title}</div>
        <div class="nudge-subtext">${scenario.persuasiveCopy.subtext}</div>
        ${scenario.persuasiveCopy.urgency ? `<div class="nudge-urgency">${scenario.persuasiveCopy.urgency}</div>` : ''}
      </div>
      <div class="nudge-reason">${nudge.reason}</div>
      <div class="nudge-products">
        ${nudge.products.map(p => `<span class="tag">${p.name} - £${p.price.toFixed(2)}</span>`).join('')}
      </div>
      <div class="cta-row">
        ${savingsText ? `<span class="badge-save">${savingsText}</span>` : ''}
        <button id="addBtn" class="btn-primary">${scenario.ctaText.primary}</button>
        <button id="dismissBtn" class="btn-secondary">${scenario.ctaText.secondary}</button>
      </div>
    `;
    
    nudgeContainer.classList.add('open');
    setupNudgeButtons(nudge, triggerSku);
  }

  // Regular nudge display (fallback)
  function showNudge(nudge: NudgeCandidate) {
    updateActivityLog(nudge);

    const savingsText = `Save £${nudge.savings.toFixed(2)}`;
    nudgeContainer.setAttribute('role', 'dialog');
    nudgeContainer.setAttribute('aria-label', `${nudge.title}. ${nudge.reason}. ${savingsText}`);
    
    nudgeContainer.innerHTML = `
      <div class="nudge-header">
        <div class="nudge-title">${nudge.title}</div>
      </div>
      <div class="nudge-reason">${nudge.reason}</div>
      <div class="nudge-products">
        ${nudge.products.map(p => `<span class="tag">${p.name}</span>`).join('')}
      </div>
      <div class="cta-row">
        <span class="badge-save">${savingsText}</span>
        <button id="addBtn" class="btn-primary">Add</button>
        <button id="dismissBtn" class="btn-secondary">Dismiss</button>
      </div>
    `;
    
    nudgeContainer.classList.add('open');
    setupNudgeButtons(nudge);
  }

  // Setup nudge button handlers
  function setupNudgeButtons(nudge: NudgeCandidate, triggerSku?: string) {
    const addBtn = document.getElementById('addBtn')!;
    const dismissBtn = document.getElementById('dismissBtn')!;
    
    addBtn.onclick = () => {
      // Add trigger product if provided
      if (triggerSku) {
        const existing = session.basket.find(b => b.sku === triggerSku);
        if (existing) existing.qty += 1;
        else session.basket.push({ sku: triggerSku, qty: 1 });
      }
      
      // Add recommended products
      for (const p of nudge.products) {
        const existing = session.basket.find(b => b.sku === p.sku);
        if (existing) existing.qty += 1;
        else session.basket.push({ sku: p.sku, qty: 1 });
      }
      renderBasket();
      nudgeContainer.classList.remove('open');
      nudgeContainer.innerHTML = '';
    };
    
    dismissBtn.onclick = () => {
      // For dismiss, only add trigger product if it's a substitute scenario (where user keeps current)
      if (triggerSku) {
        const matchingScenario = scenarios.find(s => s.triggerProduct === triggerSku);
        const isSubstituteScenario = matchingScenario?.nudgeType === 'better-fit-substitute';
        
        if (isSubstituteScenario) {
          // For substitutes, add the original trigger product they wanted to keep
          const existing = session.basket.find(b => b.sku === triggerSku);
          if (existing) existing.qty += 1;
          else session.basket.push({ sku: triggerSku, qty: 1 });
          renderBasket();
        }
        // For other scenarios (complements, deals), dismissing means no products are added
      }
      
      nudgeContainer.classList.remove('open');
      nudgeContainer.innerHTML = '';
    };
  }

  // Update activity log
  function updateActivityLog(nudge: NudgeCandidate) {
    if (activityLog) {
      const typeToClass: Record<string, string> = {
        'family-optimizer': 'pill-stockup',
        'multibuy-completion': 'pill-multibuy',
        'protein-complement': 'pill-complement',
        'better-fit-substitute': 'pill-substitute',
        'meal-completion': 'pill-complement',
        'occasion-upgrade': 'pill-tradeup',
        complement: 'pill-complement',
        multibuy: 'pill-multibuy',
        substitute: 'pill-substitute',
        mission: 'pill-mission',
        tradeup: 'pill-tradeup',
        stockup: 'pill-stockup',
        holdoff: 'pill-holdoff'
      };
      
      const pillClass = typeToClass[nudge.type] || 'pill-complement';
      const row = document.createElement('div');
      row.style.marginBottom = '6px';
      row.innerHTML = `<span class="pill ${pillClass}">${nudge.type}</span> <span style="color:var(--brand-navy); font-weight:600;">${nudge.title}</span> <span style="color:var(--muted)">— ${nudge.reason}</span>`;
      
      if (activityLog.textContent === 'No nudges yet') {
        activityLog.textContent = '';
        // Dim the trigger guide since nudges are now happening
        if (nudgeTriggerGuide) {
          nudgeTriggerGuide.style.opacity = '0.6';
        }
      }
      activityLog.prepend(row);
    }
  }

  // Get emoji for nudge type
  function getTypeEmoji(type: string): string {
    const typeEmojis: Record<string, string> = {
      'family-optimizer': '💰',
      'multibuy-completion': '🎯',
      'protein-complement': '💪',
      'better-fit-substitute': '🎯',
      'meal-completion': '⚡',
      'occasion-upgrade': '🍕'
    };
    return typeEmojis[type] || '🛒';
  }

  // Show checkout summary with savings and benefits
  function showCheckoutSummary() {
    const profile = USER_PROFILES[currentProfileType];
    let totalSavings = 0;
    let smartChoices = 0;
    let benefits: string[] = [];

    // Calculate savings from accepted nudges (this is a simplified calculation)
    const nudgeInteractions = activityLog.children.length;
    
    // Estimate savings based on profile scenarios
    for (const item of session.basket) {
      const matchingScenario = scenarios.find(s => 
        s.triggerProduct === item.sku || s.recommendedProducts.includes(item.sku)
      );
      if (matchingScenario) {
        totalSavings += matchingScenario.savings * item.qty;
        smartChoices++;
      }
    }

    // Profile-specific benefits
    if (currentProfileType === 'budget-family') {
      benefits = [
        `💰 Saved £${totalSavings.toFixed(2)} with family-size deals`,
        `🏠 Reduced shopping trips with bulk purchases`,
        `👨‍👩‍👧‍👦 Smart choices for your family budget`
      ];
    } else if (currentProfileType === 'health-fitness') {
      benefits = [
        `💪 Optimized protein intake for better performance`,
        `🎯 Made ${smartChoices} fitness-focused choices`,
        `⚡ Fueled your active lifestyle smartly`
      ];
    } else if (currentProfileType === 'convenience-professional') {
      benefits = [
        `⏰ Saved time with complete meal solutions`,
        `🎯 Made ${smartChoices} convenience-focused choices`,
        `🏆 Treated yourself after a productive week`
      ];
    }

    let total = 0;
    for (const item of session.basket) {
      const p = Catalog[item.sku];
      if (p) total += p.price * item.qty;
    }

    const profileEmojis: Record<string, string> = {
      'budget-family': '💰',
      'health-fitness': '💪',
      'convenience-professional': '⚡'
    };

    const profileEmoji = profileEmojis[currentProfileType];

    nudgeContainer.setAttribute('role', 'dialog');
    nudgeContainer.setAttribute('aria-label', 'Checkout Summary');
    
    nudgeContainer.innerHTML = `
      <div class="nudge-header">
        <div class="nudge-type-indicator">🛒</div>
        <div class="nudge-headline">Checkout Complete!</div>
        <div class="nudge-title">${profileEmoji} ${profile.displayName} Smart Shopping</div>
      </div>
      <div class="checkout-benefits">
        ${benefits.map(benefit => `<div style="margin-bottom:8px; color:var(--deal-green); font-weight:600; font-size:12px;">${benefit}</div>`).join('')}
      </div>
      <div class="checkout-summary" style="margin:16px 0; padding:12px; background:rgba(31,143,78,0.1); border-radius:12px; border:1px solid rgba(31,143,78,0.2);">
        <div style="font-weight:700; color:var(--brand-navy); margin-bottom:8px;">Order Summary</div>
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <span style="color:var(--muted);">Items (${session.basket.reduce((sum, item) => sum + item.qty, 0)})</span>
          <span style="font-weight:600;">£${total.toFixed(2)}</span>
        </div>
        ${totalSavings > 0 ? `<div style="display:flex; justify-content:space-between; margin-bottom:4px; color:var(--deal-green);">
          <span>Smart Savings</span>
          <span style="font-weight:700;">-£${totalSavings.toFixed(2)}</span>
        </div>` : ''}
        <div style="border-top:1px solid rgba(31,143,78,0.3); margin:8px 0; padding-top:8px; display:flex; justify-content:space-between; font-weight:800; font-size:16px; color:var(--brand-navy);">
          <span>Total</span>
          <span>£${(total - totalSavings).toFixed(2)}</span>
        </div>
      </div>
      <div class="cta-row">
        <button id="completeBtn" class="btn-primary">Complete Order</button>
        <button id="continueBtn" class="btn-secondary">Continue Shopping</button>
      </div>
    `;
    
    nudgeContainer.classList.add('open');
    
    const completeBtn = document.getElementById('completeBtn')!;
    const continueBtn = document.getElementById('continueBtn')!;
    
    completeBtn.onclick = () => {
      // Show in-app success message
      showOrderSuccess(profile, totalSavings, smartChoices);
      
      // Reset the session after success message
      setTimeout(() => {
        session.basket = [];
        session.scans = [];
        session.nudgeHistory = [];
        renderBasket();
        nudgeContainer.classList.remove('open');
        nudgeContainer.innerHTML = '';
      }, 3000);
    };
    
    continueBtn.onclick = () => {
      nudgeContainer.classList.remove('open');
      nudgeContainer.innerHTML = '';
    };
  }

  // Show in-app order success message
  function showOrderSuccess(profile: any, totalSavings: number, smartChoices: number) {
    const profileEmojis: Record<string, string> = {
      'budget-family': '💰',
      'health-fitness': '💪',
      'convenience-professional': '⚡'
    };

    const profileEmoji = profileEmojis[currentProfileType];
    
    nudgeContainer.innerHTML = `
      <div class="success-animation" style="text-align:center; padding:20px;">
        <div style="font-size:48px; margin-bottom:16px; animation: bounce 0.6s ease-in-out;">🎉</div>
        <div style="font-weight:800; font-size:18px; color:var(--deal-green); margin-bottom:12px;">
          Order Placed Successfully!
        </div>
        <div style="font-weight:600; color:var(--brand-navy); margin-bottom:16px; font-size:14px;">
          ${profileEmoji} Thank you for smart shopping with<br>
          <span style="color:var(--brand-orange);">${profile.displayName}</span> preferences
        </div>
        ${totalSavings > 0 ? `<div style="background:rgba(31,143,78,0.1); padding:12px; border-radius:12px; border:1px solid rgba(31,143,78,0.2); margin-bottom:16px;">
          <div style="font-size:14px; font-weight:700; color:var(--deal-green);">
            🏆 You saved £${totalSavings.toFixed(2)} with smart choices!
          </div>
        </div>` : ''}
        <div style="color:var(--muted); font-size:12px; margin-bottom:16px;">
          Made ${smartChoices} profile-optimized decisions
        </div>
        <div class="loading-dots" style="display:flex; justify-content:center; gap:4px;">
          <div style="width:8px; height:8px; background:var(--brand-orange); border-radius:50%; animation: pulse 1.5s infinite;"></div>
          <div style="width:8px; height:8px; background:var(--brand-orange); border-radius:50%; animation: pulse 1.5s infinite 0.2s;"></div>
          <div style="width:8px; height:8px; background:var(--brand-orange); border-radius:50%; animation: pulse 1.5s infinite 0.4s;"></div>
        </div>
        <div style="color:var(--muted); font-size:11px; margin-top:12px;">
          Resetting for next session...
        </div>
      </div>
    `;
  }

  // Initialize UI
  renderProfileSelector();
  renderProfileInfo();
  renderNudgeTriggerGuide();
  renderMobileProfileCards(); // Render mobile home screen
  renderMobileProducts();
  renderBasket();

  // For demo deployment, simulate online status without backend
  if (window.location.hostname === 'localhost') {
    // Ping agentic server in local development
    fetch('http://localhost:8787/rerank', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ candidates: [], profile: user }) 
    })
      .then(() => aiStatusDot?.classList.replace('status-offline','status-online'))
      .catch(() => aiStatusDot?.classList.replace('status-online','status-offline'));
  } else {
    // Show as online for demo deployment
    aiStatusDot?.classList.replace('status-offline','status-online');
  }
}