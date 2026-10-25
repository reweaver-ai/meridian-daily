import './NavBar.css';
import { CATEGORIES } from '../data/products';
import type { Category } from '../data/products';

interface NavBarProps {
  cartCount: number;
  savedCount: number;
  activeCategory: Category | 'all';
  onSelectCategory: (category: Category | 'all') => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
}

export function NavBar({
  cartCount,
  savedCount,
  activeCategory,
  onSelectCategory,
  onOpenCart,
  onOpenWishlist,
}: NavBarProps) {
  return (
    <header className="navbar">
      <div className="navbar__inner container">
        <a className="navbar__brand" href="/" aria-label="Meridian Outfitters, home">
          <span className="navbar__mark" aria-hidden="true">M</span>
          <span className="navbar__wordmark">Meridian</span>
        </a>

        <nav className="navbar__nav" aria-label="Shop categories">
          <button
            className="navbar__navlink"
            type="button"
            aria-current={activeCategory === 'all' ? 'page' : undefined}
            onClick={() => onSelectCategory('all')}
          >
            All gear
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              className="navbar__navlink"
              type="button"
              aria-current={activeCategory === category.id ? 'page' : undefined}
              onClick={() => onSelectCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </nav>

        <div className="navbar__actions">
          <button className="navbar__action" type="button" onClick={onOpenWishlist}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M12 20.4l-1.45-1.32C5.4 14.44 2 11.36 2 7.6 2 4.72 4.26 2.5 7.1 2.5c1.6 0 3.14.75 4.15 1.94l.75.88.75-.88A5.47 5.47 0 0 1 16.9 2.5C19.74 2.5 22 4.72 22 7.6c0 3.76-3.4 6.84-8.55 11.49z" />
            </svg>
            <span className="visually-hidden">
              Wishlist{savedCount === 0 ? ', empty' : `, ${savedCount} item${savedCount === 1 ? '' : 's'}`}
            </span>
            {savedCount > 0 && <span className="navbar__count" aria-hidden="true">{savedCount}</span>}
          </button>

          <button className="navbar__action navbar__action--cart" type="button" onClick={onOpenCart}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M4 7h16l-1.3 11.2a2 2 0 0 1-2 1.8H7.3a2 2 0 0 1-2-1.8z" />
              <path d="M9 7V5.5a3 3 0 0 1 6 0V7" />
            </svg>
            <span className="navbar__cartlabel">Bag</span>
            <span className="visually-hidden">
              {cartCount === 0 ? ', empty' : `, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
            </span>
            {cartCount > 0 && <span className="navbar__count" aria-hidden="true">{cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
