import { api } from '../api/api';
import { Project } from '../../types';

type ProjectPayload = Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'Expenses'> & {
  id?: string;
};

export const projectsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProjects: builder.query<Project[], void>({
      query: () => 'projects',
      transformResponse: (response: { data: Project[] }) => response.data,
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result.map(({ id }) => ({ type: 'Project' as const, id })),
              { type: 'Project', id: 'LIST' },
            ]
          : [{ type: 'Project', id: 'LIST' }],
    }),
    getProjectById: builder.query<Project, string>({
      query: (id) => `projects/${id}`,
      transformResponse: (response: { data: Project }) => response.data,
      providesTags: (_result, _error, id) => [{ type: 'Project', id }],
    }),
    createProject: builder.mutation<Project, ProjectPayload>({
      query: (body) => ({
        url: 'projects',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data: Project }) => response.data,
      invalidatesTags: [{ type: 'Project', id: 'LIST' }],
    }),
    updateProject: builder.mutation<Project, { id: string; body: Partial<ProjectPayload> }>({
      query: ({ id, body }) => ({
        url: `projects/${id}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (response: { data: Project }) => response.data,
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Project', id }, { type: 'Project', id: 'LIST' }],
    }),
    deleteProject: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `projects/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Project', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} = projectsApi;
