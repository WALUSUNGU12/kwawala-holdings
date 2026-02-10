export interface Expense {
  id: string;
  projectId: string;
  userId: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  receiptUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  addedBy: string;
  Project?: {
    id: string;
    name: string;
  };
}

export interface ExpensePayload {
  projectId: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  receiptUrl?: string;
}

export interface ExpenseFormValues {
  projectId: string;
  date: Date | null;
  description: string;
  amount: number;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  receiptUrl: string | null;
}

export interface Project {
  id: string;
  name: string;
}

// Auth state types
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'viewer';
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface ExpenseSummaryData {
  monthly: Array<{ month: number; total: number }>;
  annual: Array<{ year: number; total: number }>;
  projects: Array<{ id: string; name: string; totalExpenses: string }>;
}

export interface RootState {
  auth: AuthState;
  expenses: {
    expenseSummaryData: ExpenseSummaryData;
  };
  // Add other state slices here as needed
}
