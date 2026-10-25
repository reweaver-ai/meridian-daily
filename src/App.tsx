import { useEffect, useMemo, useState } from 'react';
import { NavBar } from './components/NavBar';
import { PromoBanner } from './components/PromoBanner';
import { Hero } from './components/Hero';
import { FlashSale } from './components/FlashSale';
import { CategoryTile } from './components/CategoryTile';
import { SearchBar } from './components/SearchBar';
import { ProductCard } from './components/ProductCard';
import { RecommendationRail } from './components/RecommendationRail';
import { ReviewList } from './components/ReviewList';
import { LoyaltyWidget } from './components/LoyaltyWidget';
import { GiftCardTeaser } from './components/GiftCardTeaser';
import { NewsletterModal } from './components/NewsletterModal';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { Footer } from './components/Footer';
import type { ShippingQuote } from './components/ShippingEstimate';
import { CATEGORIES, HERO_IMAGE, PRODUCTS, productById } from './data/products';
import type { Category } from './data/products';
import { REVIEWS } from './data/reviews';
import type { CartLine } from './lib/cart';
import {
  FREE_SHIPPING_AT_CENTS,
  FLAT_SHIPPING_CENTS,
  addLine,
  computeTotals,
  countItems,
  isKnownCoupon,
  removeLine,
  setLineQty,
} from './lib/cart';
import { loadWishlist, saveWishlist, toggleSaved } from './lib/wishlist';

type Filter = Category | 'all';

const SORTS = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'rating', label: 'Top rated' },
] as const;

type SortId = (typeof SORTS)[number]['id'];

const GIFT_CARD_AMOUNTS = [5000, 10000, 15000, 25000];

const FOOTER_COLUMNS = [
  { heading: 'Shop', links: ['New arrivals', 'Outerwear', 'Footwear', 'Accessories', 'Gift cards'] },
  { heading: 'Support', links: ['Shipping', 'Returns', 'Size guide', 'Repairs', 'Contact'] },
  { heading: 'Company', links: ['Our materials', 'Field notes', 'Stores', 'Careers'] },
];

const FOOTER_PROMISES = ['Free returns for 60 days', 'Carbon-neutral shipping', 'Lifetime repairs'];

/** The flash sale runs to the end of the current day, store time. */
function endOfToday(): Date {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return end;
}

export function App() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [saved, setSaved] = useState<string[]>(loadWishlist);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortId>('featured');
  const [giftAmount, setGiftAmount] = useState(GIFT_CARD_AMOUNTS[1]);

  const saleEndsAt = useMemo(endOfToday, []);

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matched = PRODUCTS.filter((product) => {
      const inCategory = filter === 'all' || product.category === filter;
      const matchesSearch =
        term === '' ||
        product.name.toLowerCase().includes(term) ||
        product.blurb.toLowerCase().includes(term) ||
        product.colorway.toLowerCase().includes(term);
      return inCategory && matchesSearch;
    });

    switch (sort) {
      case 'price-asc':
        return [...matched].sort((a, b) => a.priceCents - b.priceCents);
      case 'price-desc':
        return [...matched].sort((a, b) => b.priceCents - a.priceCents);
      case 'rating':
        return [...matched].sort((a, b) => b.rating - a.rating);
      default:
        return matched;
    }
  }, [filter, search, sort]);

  const recommended = useMemo(() => {
    const inBag = new Set(lines.map((line) => line.product.id));
    return PRODUCTS.filter((product) => !inBag.has(product.id) && product.rating >= 4.4).slice(0, 6);
  }, [lines]);

  const totals = useMemo(() => computeTotals(lines, couponCode), [lines, couponCode]);

  const savedProducts = useMemo(
    () => saved.map(productById).filter((product) => product !== undefined),
    [saved],
  );

  useEffect(() => {
    saveWishlist(saved);
  }, [saved]);

  function handleAdd(id: string) {
    const product = productById(id);
    if (!product) return;
    setLines((current) => addLine(current, product));
    setCartOpen(true);
    setOrderPlaced(false);
  }

  function handleToggleSaved(id: string) {
    setSaved((current) => toggleSaved(current, id));
  }

  function handleMoveToCart(id: string) {
    setSaved((current) => current.filter((savedId) => savedId !== id));
    setWishlistOpen(false);
    handleAdd(id);
  }

  function handleApplyCode(code: string): string | null {
    if (!isKnownCoupon(code)) return `We don’t recognise “${code}”.`;
    setCouponCode(code);
    return null;
  }

  function handleEstimateShipping(postcode: string): ShippingQuote | null {
    // The fictional warehouse ships anywhere but the 999xx test range.
    if (postcode.startsWith('999')) return null;
    const nearby = postcode.startsWith('9');
    return {
      postcode,
      arrivesFrom: nearby ? '2' : '4',
      arrivesTo: nearby ? '4 business days' : '7 business days',
      costCents: totals.subtotalCents >= FREE_SHIPPING_AT_CENTS ? 0 : FLAT_SHIPPING_CENTS,
    };
  }

  function handlePlaceOrder() {
    setLines([]);
    setCouponCode(null);
    setCheckingOut(false);
    setCartOpen(false);
    setOrderPlaced(true);
  }

  function handleSelectCategory(next: Filter) {
    setFilter(next);
    setSearch('');
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="app">
      <a className="app__skip" href="#catalog">Skip to products</a>

      <PromoBanner
        message="Free shipping on orders over $150."
        code="TRAIL10"
        detailsHref="/shipping"
      />

      <NavBar
        cartCount={countItems(lines)}
        savedCount={saved.length}
        activeCategory={filter}
        onSelectCategory={handleSelectCategory}
        onOpenCart={() => setCartOpen(true)}
        onOpenWishlist={() => setWishlistOpen(true)}
      />

      <main>
        {orderPlaced && (
          <p className="app__confirmation" role="status">
            Order placed. A confirmation is on its way to your inbox.
          </p>
        )}

        <Hero
          eyebrow="Fall / Winter 2026"
          title="Find your line."
          copy="Technical essentials for the days that start before the trailhead and end wherever the weather does."
          cta="Shop the collection"
          ctaHref="#catalog"
          secondaryCta="Our materials"
          secondaryHref="/our-materials"
          image={HERO_IMAGE}
        />

        <FlashSale
          headline="End-of-season boots, 20% off"
          copy="Last season's colourways in the Switchback and Fieldstone, while stock lasts."
          endsAt={saleEndsAt}
          ctaHref="#catalog"
        />

        <section className="section" aria-labelledby="categories-title">
          <div className="container">
            <div className="section__head">
              <div>
                <p className="eyebrow">Shop by category</p>
                <h2 className="section__title" id="categories-title">Three ways to kit out.</h2>
              </div>
            </div>
            <div className="category-grid">
              {CATEGORIES.map((category) => (
                <CategoryTile
                  key={category.id}
                  category={category}
                  productCount={PRODUCTS.filter((p) => p.category === category.id).length}
                  onSelect={handleSelectCategory}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="catalog" aria-labelledby="catalog-title">
          <div className="container">
            <div className="section__head">
              <div>
                <p className="eyebrow">The collection</p>
                <h2 className="section__title" id="catalog-title">Built for the long way around.</h2>
                <p className="section__lede">
                  Every piece is repairable, and every boot in the range can be resoled.
                </p>
              </div>
              <SearchBar value={search} onChange={setSearch} resultCount={visibleProducts.length} />
            </div>

            <div className="catalog__toolbar">
              <div className="catalog__filters" role="group" aria-label="Filter by category">
                <button
                  className="catalog__filter"
                  type="button"
                  aria-pressed={filter === 'all'}
                  onClick={() => setFilter('all')}
                >
                  All gear
                </button>
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    className="catalog__filter"
                    type="button"
                    aria-pressed={filter === category.id}
                    onClick={() => setFilter(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              <label className="catalog__sort">
                <span className="catalog__sort-label">Sort</span>
                <select
                  className="input catalog__select"
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortId)}
                >
                  {SORTS.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>

            {visibleProducts.length === 0 ? (
              <div className="catalog__empty">
                <h3 className="catalog__empty-title">No gear matches that search.</h3>
                <p className="note">Try a different term, or browse the full range.</p>
                <button
                  className="btn btn--dark"
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setFilter('all');
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="product-grid">
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={handleAdd}
                    saved={saved.includes(product.id)}
                    onToggleSaved={handleToggleSaved}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <RecommendationRail
          title="You might also need"
          lede="Top-rated pieces that round out the kit."
          products={recommended}
          onAdd={handleAdd}
        />

        <ReviewList reviews={REVIEWS} />

        <section className="section" aria-labelledby="perks-title">
          <div className="container">
            <h2 className="visually-hidden" id="perks-title">Membership and gift cards</h2>
            <div className="perks-grid">
              <LoyaltyWidget tier="Ridge" points={1840} nextTierAt={2500} nextTier="Summit" />
              <GiftCardTeaser
                amountsCents={GIFT_CARD_AMOUNTS}
                selected={giftAmount}
                onSelect={setGiftAmount}
              />
            </div>
          </div>
        </section>
      </main>

      <Footer
        columns={FOOTER_COLUMNS}
        promises={FOOTER_PROMISES}
        onOpenNewsletter={() => setNewsletterOpen(true)}
      />

      <CartDrawer
        open={cartOpen}
        lines={lines}
        totals={totals}
        freeShippingAtCents={FREE_SHIPPING_AT_CENTS}
        appliedCode={couponCode}
        checkingOut={checkingOut}
        onClose={() => {
          setCartOpen(false);
          setCheckingOut(false);
        }}
        onChangeQty={(id, qty) => setLines((current) => setLineQty(current, id, qty))}
        onRemove={(id) => setLines((current) => removeLine(current, id))}
        onApplyCode={handleApplyCode}
        onRemoveCode={() => setCouponCode(null)}
        onEstimateShipping={handleEstimateShipping}
        onStartCheckout={() => setCheckingOut(true)}
        onCancelCheckout={() => setCheckingOut(false)}
        onPlaceOrder={handlePlaceOrder}
      />

      <WishlistDrawer
        open={wishlistOpen}
        products={savedProducts}
        onClose={() => setWishlistOpen(false)}
        onMoveToCart={handleMoveToCart}
        onRemove={handleToggleSaved}
      />

      <NewsletterModal
        open={newsletterOpen}
        onClose={() => setNewsletterOpen(false)}
        onSubscribe={() => undefined}
      />
    </div>
  );
}
