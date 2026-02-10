# GlobalDrawers System

## Current Drawers

| Key       | Component            | Purpose                                                              |
| --------- | -------------------- | -------------------------------------------------------------------- |
| `modular` | ModularDrawerWrapper | Multi-purpose drawer for account selection, add account, stake, etc. |
| `receive` | ReceiveDrawerWrapper | Drawer for receiving funds options                                   |
| `reborn`  | RebornDrawerWrapper  | Drawer for reborn experience to connect and buy device options       |

## File Structure

```
src/GlobalDrawers/
├── index.tsx           # Main component that renders all drawers
├── registry.ts         # Registry of all available drawers
└── README.md
```

## How It Works

### 1. Drawer Wrappers

Each drawer has a wrapper component that:

- Manages its own state via Redux or Context
- Renders the drawer UI component

Example:

```typescript
export function ModularDrawerWrapper() {
  const { isOpen, closeDrawer, ...props } = useModularDrawerController();

  return (
    <ModularDrawer
      isOpen={isOpen}
      onClose={closeDrawer}
      {...props}
    />
  );
}
```

### 2. Registry

All drawers are registered in `registry.ts`:

```typescript
export const DRAWER_REGISTRY = {
  modularAssets: {
    component: ModularDrawerWrapper,
  },
  // ... more drawers
};
```

### 3. Global Rendering

The `GlobalDrawers` component automatically renders all registered drawers:

```typescript
function GlobalDrawers({ children }: Props) {
  return (
    <>
      {children}
      {DRAWER_ENTRIES.map(({ key, component: DrawerWrapper }) => (
        <DrawerWrapper key={key} />
      ))}
    </>
  );
}
```

## Adding a New Drawer

### Step 1: Create the Drawer Component

Create your drawer UI component (e.g., `MyDrawer.tsx`):

```typescript
interface MyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  // ... other props
}

export function MyDrawer({ isOpen, onClose, ...props }: MyDrawerProps) {
  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
    >
      {/* Your drawer content */}
    </QueuedDrawer>
  );
}
```

### Step 2: Create the Redux Slice (or Context)

Create a Redux slice for your drawer state (e.g., `reducers/myDrawer.ts`):

```typescript
interface MyDrawerState {
  isOpen: boolean;
  // ... other state
}

const myDrawerSlice = createSlice({
  name: "myDrawer",
  initialState: { isOpen: false },
  reducers: {
    openMyDrawer: (state, action) => {
      state.isOpen = true;
      // ... handle params
    },
    closeMyDrawer: state => {
      state.isOpen = false;
    },
  },
});

export const { openMyDrawer, closeMyDrawer } = myDrawerSlice.actions;
export const myDrawerSelector = (state: State) => state.myDrawer;
```

### Step 3: Create the Controller Hook

Create a hook to control your drawer (e.g., `useMyDrawerController.ts`):

```typescript
export function useMyDrawerController() {
  const dispatch = useDispatch();
  const { isOpen, ...state } = useSelector(myDrawerSelector);

  const openDrawer = useCallback(
    params => {
      dispatch(openMyDrawer(params));
    },
    [dispatch],
  );

  const closeDrawer = useCallback(() => {
    dispatch(closeMyDrawer());
  }, [dispatch]);

  return {
    isOpen,
    openDrawer,
    closeDrawer,
    ...state,
  };
}
```

### Step 4: Create the Wrapper

Create a wrapper component (e.g., `MyDrawerWrapper.tsx`):

```typescript
export function MyDrawerWrapper() {
  const { isOpen, closeDrawer, ...props } = useMyDrawerController();

  return (
    <MyDrawer
      isOpen={isOpen}
      onClose={closeDrawer}
      {...props}
    />
  );
}
```

### Step 5: Register in the Registry

Add your drawer to `GlobalDrawers/registry.ts`:

```typescript
import { MyDrawerWrapper } from "LLM/features/MyFeature/MyDrawerWrapper";

export const DRAWER_REGISTRY = {
  modularAssets: { ... },
  receive: { ... },
  myDrawer: {
    component: MyDrawerWrapper,
  },
};
```

### Step 6: Use Anywhere in the App

Now you can control your drawer from anywhere:

```typescript
function MyComponent() {
  const { openDrawer } = useMyDrawerController();

  return (
    <Button onPress={() => openDrawer({ /* params */ })}>
      Open My Drawer
    </Button>
  );
}
```
