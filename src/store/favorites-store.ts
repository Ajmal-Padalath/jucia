import { create } from "zustand";
import { persist } from "zustand/middleware";

type FavoritesState = {
  favorites: string[];
  toggle: (foodItemId: string) => void;
  isFavorite: (foodItemId: string) => boolean;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggle: (foodItemId) => {
        const favs = get().favorites;
        set({
          favorites: favs.includes(foodItemId)
            ? favs.filter((id) => id !== foodItemId)
            : [...favs, foodItemId],
        });
      },
      isFavorite: (foodItemId) => get().favorites.includes(foodItemId),
    }),
    { name: "restaurant-favorites" }
  )
);
