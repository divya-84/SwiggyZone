import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Cart, CartItem } from '@swiggyzone/shared';

const initialState: Cart = {
  items: [],
  subtotal: 0,
  deliveryFee: 40,
  tax: 0,
  discount: 0,
  total: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<CartItem>) {
      const existingItem = state.items.find((item) => item.dish.id === action.payload.dish.id);
      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
      state.subtotal = state.items.reduce((sum, item) => sum + item.dish.price * item.quantity, 0);
      state.tax = parseFloat((state.subtotal * 0.05).toFixed(2));
      state.total = state.subtotal + state.deliveryFee + state.tax - state.discount;
    },
    clearCart(state) {
      state.items = [];
      state.subtotal = 0;
      state.tax = 0;
      state.total = 0;
      state.appliedCoupon = undefined;
    },
  },
});

export const { addToCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
