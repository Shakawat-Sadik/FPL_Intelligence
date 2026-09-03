# Zustand Cheat Sheet

## 1. Basics

| What you want to do in plain English   | The Zustand TypeScript Code                          | What happens                             |
| :----------------------------------------| :-------------------------------------------------------| :-------------------------------------------|
| **Create a store**                      | `create<State>((set) => ({ ... }))`                    | Returns a hook you call in components     |
| **Read state in a component**           | `const count = useStore((s) => s.count)`               | Component re-renders only when `count` changes |
| **Update state**                        | `set({ count: 1 })`                                    | Shallow-merges into existing state        |
| **Update based on previous state**      | `set((state) => ({ count: state.count + 1 }))`         | Safe for concurrent updates                |
| **Call an action from a component**     | `const increment = useStore((s) => s.increment)`       | Grabs the function reference from the store |

```ts
// src/store/use-ui-store.ts
import { create } from "zustand";

interface UIState {
  isTransferDrawerOpen: boolean;
  toggleTransferDrawer: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isTransferDrawerOpen: false,
  toggleTransferDrawer: () =>
    set((state) => ({ isTransferDrawerOpen: !state.isTransferDrawerOpen })),
}));
```

```tsx
// Usage in a component
"use client";
import { useUIStore } from "@/store/use-ui-store";

export function TransferButton() {
  const isOpen = useUIStore((s) => s.isTransferDrawerOpen);
  const toggle = useUIStore((s) => s.toggleTransferDrawer);

  return <button onClick={toggle}>{isOpen ? "Close" : "Open"} Drawer</button>;
}
```

---

## 2. Selecting state (avoiding unnecessary re-renders)

| Plain English                                     | Zustand code                                                  |
| :----------------------------------------------------| :------------------------------------------------------------- |
| Subscribe to one field                              | `useStore((s) => s.count)`                                    |
| Subscribe to the whole store (re-renders on any change) | `useStore()`                                                |
| Subscribe to multiple fields with shallow comparison   | `useStore(useShallow((s) => ({ a: s.a, b: s.b })))`          |
| Read state outside React (no subscription)            | `useStore.getState().count`                                  |
| Update state outside React (e.g. in a utility function)| `useStore.setState({ count: 0 })`                             |
| Subscribe manually outside React (e.g. in an effect)   | `useStore.subscribe((state) => console.log(state))`          |

> Always select the smallest slice of state you need. Selecting the whole store (`useStore()`) re-renders the component on *every* store change, defeating the point of granular selectors.

```ts
import { useShallow } from "zustand/react/shallow";

const { isOpen, view } = useUIStore(
  useShallow((s) => ({ isOpen: s.isTransferDrawerOpen, view: s.activeView }))
);
```

---

## 3. Actions (functions that live inside the store)

| Plain English                       | Zustand code                                                          |
| :---------------------------------------| :---------------------------------------------------------------------- |
| Set a value directly                   | `set({ user: newUser })`                                              |
| Update based on current state          | `set((state) => ({ count: state.count + 1 }))`                       |
| Reset the store to initial values      | `set(initialState)`                                                   |
| Perform an async action (e.g. fetch)   | `fetchUser: async (id) => { const user = await api.getUser(id); set({ user }); }` |
| Replace the entire state (no merge)    | `set(newState, true)`                                                 |

```ts
interface UserState {
  user: User | null;
  loading: boolean;
  fetchUser: (id: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  loading: false,
  fetchUser: async (id) => {
    set({ loading: true });
    const user = await fetch(`/api/users/${id}`).then((r) => r.json());
    set({ user, loading: false });
  },
}));
```

---

## 4. Middleware

| Plain English                                    | Zustand code                                                      |
| :----------------------------------------------------| :--------------------------------------------------------------------|
| Persist store to localStorage                       | `create(persist((set) => ({ ... }), { name: "storage-key" }))`     |
| Log every state change to the console (dev tool)     | `create(devtools((set) => ({ ... })))`                             |
| Combine persist + devtools                           | `create(devtools(persist((set) => ({ ... }), { name: "key" })))`  |
| Enable time-travel debugging in Redux DevTools       | `create(devtools((set) => ({ ... }), { name: "MyStore" }))`        |
| Subscribe to specific field changes (middleware)     | `create(subscribeWithSelector((set) => ({ ... })))`                |
| Store immutably with mutable-looking syntax (Immer)  | `create(immer((set) => ({ push: () => set((state) => { state.items.push(1); }) })))` |

```ts
import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set) => ({
        theme: "dark",
        setTheme: (theme) => set({ theme }),
      }),
      { name: "settings-storage" } // localStorage key
    )
  )
);
```

*(Note the extra `()` after `create<SettingsState>()` — required by TypeScript when chaining middleware, to preserve correct type inference.)*

---

## 5. Persist middleware options

| Plain English                                  | Zustand code                                                       |
| :--------------------------------------------------| :---------------------------------------------------------------------|
| Choose storage key                                | `{ name: "storage-key" }`                                          |
| Use sessionStorage instead of localStorage         | `{ name: "key", storage: createJSONStorage(() => sessionStorage) }` |
| Persist only specific fields                      | `{ name: "key", partialize: (state) => ({ theme: state.theme }) }`  |
| Run logic after rehydration from storage          | `{ name: "key", onRehydrateStorage: () => (state) => { ... } }`     |
| Version + migrate persisted state                 | `{ name: "key", version: 1, migrate: (persisted, version) => { ... } }` |

---

## 6. Organizing multiple stores

| Plain English                                | Pattern                                                          |
| :--------------------------------------------- | :-------------------------------------------------------------------|
| One store per domain concern                  | `useUIStore`, `useUserStore`, `useFilterStore` — separate files    |
| Combine slices into one store (slice pattern)  | Define `createUISlice`, `createUserSlice`, spread them into one `create<State>()((...a) => ({ ...createUISlice(...a), ...createUserSlice(...a) }))` |
| Derive computed values                        | Compute inside the selector: `useStore((s) => s.items.length)`     |

```ts
// Slice pattern for larger apps
interface UISlice {
  isDrawerOpen: boolean;
  toggleDrawer: () => void;
}

const createUISlice = (set: SetState): UISlice => ({
  isDrawerOpen: false,
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
});

export const useAppStore = create<UISlice & UserSlice>()((...a) => ({
  ...createUISlice(...a),
  ...createUserSlice(...a),
}));
```

---

## 7. Zustand + Next.js App Router gotchas

| Gotcha                                                   | Fix                                                                 |
| :------------------------------------------------------------| :-----------------------------------------------------------------------|
| Store used in a Server Component                            | Don't — Zustand stores are client-only. Add `"use client"` to any component that calls `useStore`. |
| Store state leaking between users (SSR)                     | Don't define a single module-level store that holds per-request/user data on the server — Zustand stores here are fine only for client-side UI state (drawers, toggles, filters), not user session data. |
| Hydration mismatch with `persist`                            | Wrap usage in a mounted check, or accept the one-frame flash: `const hasHydrated = useStore.persist.hasHydrated()`. |

---

## 8. This project's actual usage (Phase 5: Client State)

```ts
// src/store/use-ui-store.ts
import { create } from "zustand";

interface UIState {
  isTransferDrawerOpen: boolean;
  toggleTransferDrawer: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isTransferDrawerOpen: false,
  toggleTransferDrawer: () =>
    set((state) => ({ isTransferDrawerOpen: !state.isTransferDrawerOpen })),
}));
```

Wire it to a Shadcn `Button` + `Sheet`:

```tsx
"use client";
import { useUIStore } from "@/store/use-ui-store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function TransferDrawer() {
  const isOpen = useUIStore((s) => s.isTransferDrawerOpen);
  const toggle = useUIStore((s) => s.toggleTransferDrawer);

  return (
    <Sheet open={isOpen} onOpenChange={toggle}>
      <SheetTrigger asChild>
        <Button onClick={toggle}>Open Transfers</Button>
      </SheetTrigger>
      <SheetContent>{/* Drawer content */}</SheetContent>
    </Sheet>
  );
}
```
