import { api } from '../api/api';
import { User } from '../../types';

// Helper to set the token in the headers for subsequent requests
export const setAuthToken = (_token: string | null) => {
  // This function is now a bit of a legacy. RTK Query handles headers automatically.
  // However, it can be useful for initial setup or if you need to interact with a non-RTK Query part of the app.
  // The main logic is now within the `prepareHeaders` of the base API slice.
};

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<{ token: string; user: User }, any>({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Profile'],
    }),
    register: builder.mutation<User, Partial<User>>({
      query: (body) => ({
        url: 'auth/register',
        method: 'POST',
        body,
      }),
    }),
    getProfile: builder.query<User, void>({
      query: () => 'auth/me',
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation<User, Partial<User>>({
      query: (body) => ({
        url: 'auth/me',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Profile'],
    }),
    changePassword: builder.mutation<{ message: string }, { currentPassword: string; newPassword: string }>({
      query: (passwords) => ({
        url: 'auth/change-password',
        method: 'POST',
        body: passwords,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} = authApi;
