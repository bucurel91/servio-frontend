export { apiClient, setTokenProvider, setBaseUrl } from "./client";

import { apiClient } from "./client";
import type {
  AuthResponse,
  RegisterRequest,
  UserResponse,
  UpdateUserRequest,
  CarRequest,
  CarResponse,
  CarMakeResponse,
  CarModelResponse,
  RepairRequestRequest,
  RepairRequestSummaryResponse,
  RepairRequestDetailResponse,
  AutoServiceProfileResponse,
  UpdateAutoServiceProfileRequest,
  ReviewRequest,
  ReviewResponse,
  CategoryResponse,
  CategoryRequest,
  LocationResponse,
  AttachmentResponse,
  SubscriptionResponse,
  FcmTokenRequest,
  Page,
} from "@servio/types";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>("/api/auth/register", data).then((r) => r.data),

  me: () =>
    apiClient.get<AuthResponse>("/api/auth/me").then((r) => r.data),
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersApi = {
  getMe: () =>
    apiClient.get<UserResponse>("/api/users/me").then((r) => r.data),

  updateMe: (data: UpdateUserRequest) =>
    apiClient.put<UserResponse>("/api/users/me", data).then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<UserResponse>(`/api/users/${id}`).then((r) => r.data),

  deleteMe: () =>
    apiClient.delete("/api/users/me"),
};

// ─── Cars ─────────────────────────────────────────────────────────────────────

export const carsApi = {
  getAll: () =>
    apiClient.get<CarResponse[]>("/api/cars").then((r) => r.data),

  create: (data: CarRequest) =>
    apiClient.post<CarResponse>("/api/cars", data).then((r) => r.data),

  update: (id: number, data: CarRequest) =>
    apiClient.put<CarResponse>(`/api/cars/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/api/cars/${id}`),
};

// ─── Car Makes & Models ───────────────────────────────────────────────────────

export const carMakesApi = {
  getAll: () =>
    apiClient.get<CarMakeResponse[]>("/api/car-makes").then((r) => r.data),

  getModels: (makeId: number) =>
    apiClient.get<CarModelResponse[]>(`/api/car-makes/${makeId}/models`).then((r) => r.data),
};

// ─── Repair Requests ──────────────────────────────────────────────────────────

export const requestsApi = {
  getAll: (params?: { cityId?: number; page?: number; size?: number }) =>
    apiClient.get<Page<RepairRequestSummaryResponse>>("/api/requests", { params }).then((r) => r.data),

  getMy: (params?: { status?: "OPEN" | "CLOSED"; page?: number; size?: number }) =>
    apiClient.get<Page<RepairRequestDetailResponse>>("/api/requests/my", { params }).then((r) => r.data),

  getServiceInbox: (params?: { page?: number; size?: number }) =>
    apiClient.get<Page<RepairRequestSummaryResponse>>("/api/requests/service/inbox", { params }).then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<RepairRequestDetailResponse>(`/api/requests/${id}`).then((r) => r.data),

  viewDetail: (id: number) =>
    apiClient.get<RepairRequestDetailResponse>(`/api/requests/${id}/details`).then((r) => r.data),

  create: (data: RepairRequestRequest) =>
    apiClient.post<RepairRequestSummaryResponse>("/api/requests", data).then((r) => r.data),

  accept: (id: number) =>
    apiClient.post<RepairRequestDetailResponse>(`/api/requests/${id}/accept`).then((r) => r.data),

  reject: (id: number) =>
    apiClient.post<void>(`/api/requests/${id}/reject`).then((r) => r.data),

  close: (id: number) =>
    apiClient.patch<RepairRequestDetailResponse>(`/api/requests/${id}/close`).then((r) => r.data),
};

// ─── Auto Services ────────────────────────────────────────────────────────────

export const servicesApi = {
  getAll: (params?: { page?: number; size?: number }) =>
    apiClient.get<Page<AutoServiceProfileResponse>>("/api/services", { params }).then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<AutoServiceProfileResponse>(`/api/services/${id}`).then((r) => r.data),

  getMy: () =>
    apiClient.get<AutoServiceProfileResponse>("/api/services/my").then((r) => r.data),

  updateMy: (data: UpdateAutoServiceProfileRequest) =>
    apiClient.put<AutoServiceProfileResponse>("/api/services/my", data).then((r) => r.data),
};

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const reviewsApi = {
  getByService: (autoServiceUserId: number, params?: { page?: number; size?: number }) =>
    apiClient
      .get<Page<ReviewResponse>>(`/api/reviews/service/${autoServiceUserId}`, { params })
      .then((r) => r.data),

  create: (data: ReviewRequest) =>
    apiClient.post<ReviewResponse>("/api/reviews", data).then((r) => r.data),
};

// ─── Categories ───────────────────────────────────────────────────────────────

export const categoriesApi = {
  getAll: () =>
    apiClient.get<CategoryResponse[]>("/api/categories").then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<CategoryResponse>(`/api/categories/${id}`).then((r) => r.data),

  // Admin only
  create: (data: CategoryRequest) =>
    apiClient.post<CategoryResponse>("/api/categories", data).then((r) => r.data),

  update: (id: number, data: CategoryRequest) =>
    apiClient.put<CategoryResponse>(`/api/categories/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/api/categories/${id}`),
};

// ─── Locations ────────────────────────────────────────────────────────────────

export const locationsApi = {
  getRegions: () =>
    apiClient.get<LocationResponse[]>("/api/locations/regions").then((r) => r.data),

  getCitiesByRegion: (regionId: number) =>
    apiClient.get<LocationResponse[]>(`/api/locations/regions/${regionId}/cities`).then((r) => r.data),

  getChisinauZones: () =>
    apiClient.get<LocationResponse[]>("/api/locations/chisinau-zones").then((r) => r.data),
};

// ─── Attachments ──────────────────────────────────────────────────────────────

type UploadFile = File | Blob | { uri: string; type: string; name: string };

function buildFormData(file: UploadFile): FormData {
  const form = new FormData();
  // On React Native, FormData accepts { uri, type, name } directly.
  // On web, file is a Blob — append with filename so the backend sees a proper part.
  if (file instanceof Blob) {
    const name = (file as File).name ?? "photo.jpg";
    form.append("file", file, name);
  } else {
    form.append("file", file as any);
  }
  return form;
}

export const attachmentsApi = {
  uploadAvatar: (file: UploadFile) =>
    apiClient
      .post<AttachmentResponse>("/api/attachments/avatar", buildFormData(file))
      .then((r) => r.data),

  uploadRequestPhoto: (requestId: number, file: UploadFile) =>
    apiClient
      .post<AttachmentResponse>(`/api/attachments/request/${requestId}`, buildFormData(file))
      .then((r) => r.data),

  uploadServicePhoto: (file: UploadFile) =>
    apiClient
      .post<AttachmentResponse>("/api/attachments/service-photo", buildFormData(file))
      .then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/api/attachments/${id}`),
};

// ─── FCM Tokens ───────────────────────────────────────────────────────────────

export const fcmApi = {
  registerToken: (data: FcmTokenRequest) =>
    apiClient.post("/api/fcm/token", data),

  deleteToken: (token: string) =>
    apiClient.delete("/api/fcm/token", { params: { token } }),
};

// ─── Subscription ─────────────────────────────────────────────────────────────

export const subscriptionApi = {
  getMy: () =>
    apiClient.get<SubscriptionResponse>("/api/subscription").then((r) => r.data),
};