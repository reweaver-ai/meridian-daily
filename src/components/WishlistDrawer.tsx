import { useEffect, useRef } from 'react';
import './WishlistDrawer.css';
import type { Product } from '../data/products';
import { money } from '../lib/format';

interface WishlistDrawerProps {
  open: boolean;
  products: Product[];
  onClose: () => void;
  onMoveToCart: (id: string) => void;
  onRemove: (id: string) => void;
}

export function WishlistDrawer({ open, products, onClose, onMoveToCart, onRemove }: WishlistDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.classList.add('scroll-lock');
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('scroll-lock');
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="wishlistdrawer" role="presentation" onClick={onClose}>
      <aside
        className="wishlistdrawer__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wishlist-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="wishlistdrawer__head">
          <h2 className="wishlistdrawer__title" id="wishlist-title">
            Wishlist
            <span className="wishlistdrawer__count"> ({products.length})</span>
          </h2>
          <button
            ref={closeRef}
            className="wishlistdrawer__close"
            type="button"
            onClick={onClose}
            aria-label="Close wishlist"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <line x1="5" y1="5" x2="15" y2="15" />
              <line x1="15" y1="5" x2="5" y2="15" />
            </svg>
          </button>
        </header>

        {products.length === 0 ? (
          <div className="wishlistdrawer__empty">
            <p className="wishlistdrawer__empty-title">Nothing saved yet</p>
            <p className="note">Tap the heart on any product to keep it here for later.</p>
            <button className="btn btn--dark" type="button" onClick={onClose}>Keep shopping</button>
          </div>
        ) : (
          <div className="wishlistdrawer__body">
            <ul className="wishlistdrawer__list">
              {products.map((product) => {
                const soldOut = product.stock <= 0;
                return (
                  <li key={product.id} className="wishlistdrawer__line">
                    <img
                      className="wishlistdrawer__thumb"
                      src={product.image}
                      alt=""
                      loading="lazy"
                      width={160}
                      height={200}
                    />
                    <div className="wishlistdrawer__lineinfo">
                      <p className="wishlistdrawer__name">{product.name}</p>
                      <p className="note">{product.colorway}</p>
                      <p className="wishlistdrawer__amount">{money(product.priceCents)}</p>
                    </div>
                    <div className="wishlistdrawer__actions">
                      <button
                        className="btn btn--outline btn--small"
                        type="button"
                        disabled={soldOut}
                        onClick={() => onMoveToCart(product.id)}
                      >
                        {soldOut ? 'Sold out' : 'Move to bag'}
                        <span className="visually-hidden"> — {product.name}</span>
                      </button>
                      <button
                        className="link wishlistdrawer__remove"
                        type="button"
                        onClick={() => onRemove(product.id)}
                      >
                        Remove
                        <span className="visually-hidden"> {product.name} from wishlist</span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
