import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cart/cartSlice";
// import adminProductsReducer from "./features/adminProductsSlice";
import adminAttributesReducer from "./features/adminAttributesSlice";
import adminVariantsReducer from "./features/adminVariantsSlice";
import adminOrdersReducer from "./features/adminOrdersSlice";
import pagesReducer from "./pages/pagesSlice";
import commentsReducer from "./comments/commentSlice";
import authReducer from "./auth/authSlice";
import categoryReducer from "./categories/categoriesSlices";
import productsReducer from "./products/productsSlices";
import attributesReducer from "./attributes/attributeSlices";
import wishlistReducer from "./wishlist/wishlistSlice";
import websiteDetailReducer from "./websiteDetail/websiteDetailSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      pages: pagesReducer,
      comments: commentsReducer,
      cart: cartReducer,
      // adminProducts: adminProductsReducer,
      // adminCategories: adminCategoriesReducer,
      // adminAttributes: adminAttributesReducer,
      // adminVariants: adminVariantsReducer,
      // adminOrders: adminOrdersReducer,
      adminProducts: productsReducer,
      adminCategories: categoryReducer,
      adminAttributes: attributesReducer,
      adminVariants: adminVariantsReducer,
      adminOrders: adminOrdersReducer,
      wishlist: wishlistReducer,
      websiteDetail: websiteDetailReducer,
    },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
