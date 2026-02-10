// Represents the structure of a User
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'viewer';
  password?: string; // Only for creation/update
  createdAt?: string;
  updatedAt?: string;
}

// Represents the structure of a Project
export interface Project {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  totalBudget: number | null;
  clientName?: string | null;
  clientEmail?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  Expenses?: Expense[];
}

// Represents the structure of an Expense
export interface Expense {
  id: string;
  date: string;
  amount: string; // Stored as string to handle form inputs, but should be number
  category: string;
  description: string | null;
  receiptUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  projectId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  Project?: { // Optional: for including project details
    id: string;
    name: string;
  };
}
