import {
  addToBasket,
  clearBasket,
  getStoredBasket,
  removeFromBasket,
  subscribeToBasket,
} from "./basketStorage";

const TEA = {
  articleId: "a0000000-0000-4000-8000-000000000001",
  name: "Green tea",
  unitPrice: 12.5,
};

const MUG = {
  articleId: "a0000000-0000-4000-8000-000000000002",
  name: "Mug",
  unitPrice: 4.2,
};

describe("basketStorage", () => {
  it("starts empty", () => {
    expect(getStoredBasket()).toEqual([]);
  });

  it("keeps what was added, in the order it was added", () => {
    addToBasket(TEA);
    addToBasket(MUG);

    expect(getStoredBasket()).toEqual([TEA, MUG]);
  });

  it("ignores an article that is already in the basket", () => {
    // There is no quantity to raise, so a second click must not add a line.
    addToBasket(TEA);
    addToBasket(TEA);

    expect(getStoredBasket()).toEqual([TEA]);
  });

  it("removes one article and leaves the rest", () => {
    addToBasket(TEA);
    addToBasket(MUG);

    removeFromBasket(TEA.articleId);

    expect(getStoredBasket()).toEqual([MUG]);
  });

  it("does nothing when removing something that is not there", () => {
    addToBasket(TEA);

    removeFromBasket(MUG.articleId);

    expect(getStoredBasket()).toEqual([TEA]);
  });

  it("empties the basket", () => {
    addToBasket(TEA);
    addToBasket(MUG);

    clearBasket();

    expect(getStoredBasket()).toEqual([]);
  });

  it("survives a reload, because it lives in localStorage", () => {
    addToBasket(TEA);

    // What a fresh page load would read.
    expect(
      JSON.parse(window.localStorage.getItem("shop_basket") ?? "[]"),
    ).toEqual([TEA]);
  });

  it("recovers from a corrupted stored value instead of crashing", () => {
    window.localStorage.setItem("shop_basket", "not json");

    expect(getStoredBasket()).toEqual([]);
  });

  it("returns the same reference until something changes", () => {
    addToBasket(TEA);

    // useSyncExternalStore compares snapshots by reference; a new array on
    // every read would re-render forever.
    expect(getStoredBasket()).toBe(getStoredBasket());
  });

  describe("subscribers", () => {
    it("is told about every change", () => {
      const listener = jest.fn();
      const unsubscribe = subscribeToBasket(listener);

      addToBasket(TEA);
      removeFromBasket(TEA.articleId);
      clearBasket();

      expect(listener).toHaveBeenCalledTimes(3);
      unsubscribe();
    });

    it("stops after unsubscribing", () => {
      const listener = jest.fn();
      subscribeToBasket(listener)();

      addToBasket(TEA);

      expect(listener).not.toHaveBeenCalled();
    });

    it("hears a change made in another tab", () => {
      const listener = jest.fn();
      const unsubscribe = subscribeToBasket(listener);

      window.dispatchEvent(
        new StorageEvent("storage", { key: "shop_basket" }),
      );

      expect(listener).toHaveBeenCalled();
      unsubscribe();
    });
  });
});
