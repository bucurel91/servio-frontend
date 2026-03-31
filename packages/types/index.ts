// ─── Enums ───────────────────────────────────────────────────────────────────

export type Role = "CUSTOMER" | "AUTO_SERVICE" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";
export type RequestStatus = "OPEN" | "CLOSED";
export type SubscriptionPlan = "FREE" | "PRO" | "PREMIUM";
export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";
export type AttachmentType = "AVATAR" | "REQUEST_PHOTO" | "SERVICE_PHOTO";
export type DeviceType = "ANDROID" | "IOS" | "WEB";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  firebaseToken: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: Role;
}

export interface AuthResponse {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  phone?: string | null;
  cityId?: number | null;
}

export interface UserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  avatarUrl: string | null;
  createdAt: string;
}

// ─── Car ──────────────────────────────────────────────────────────────────────

export interface CarRequest {
  brand: string;
  model: string;
  year: number;
  engineType?: string | null;
  vin?: string | null;
}

export interface CarResponse {
  id: number;
  brand: string;
  model: string;
  year: number;
  engineType: string | null;
  vin: string | null;
  createdAt: string;
}

// ─── Category ─────────────────────────────────────────────────────────────────

export interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  sortOrder: number | null;
  children: CategoryResponse[];
}

export interface CategoryRequest {
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  parentId?: number | null;
  sortOrder?: number | null;
}

// ─── Location ─────────────────────────────────────────────────────────────────

export interface LocationResponse {
  id: number;
  name: string;
}

// ─── Attachment ───────────────────────────────────────────────────────────────

export interface AttachmentResponse {
  id: number;
  url: string;
  originalName: string;
  contentType: string;
  fileSize: number;
  type: AttachmentType;
  createdAt: string;
}

// ─── Repair Request ───────────────────────────────────────────────────────────

export interface RepairRequestRequest {
  carId: number;
  categoryId: number;
  cityId: number;
  chisinauZoneId?: number | null;
  title: string;
  description: string;
  radiusKm?: number;
}

export interface RepairRequestResponse {
  id: number;
  customerId: number;
  customerName: string;
  car: CarResponse;
  category: CategoryResponse;
  title: string;
  description: string;
  radiusKm: number;
  cityId: number | null;
  cityName: string | null;
  status: RequestStatus;
  notifiedServicesCount: number;
  photos: AttachmentResponse[];
  createdAt: string;
}

// ─── Auto Service Profile ─────────────────────────────────────────────────────

export interface UpdateAutoServiceProfileRequest {
  businessName: string;
  description?: string | null;
  address?: string | null;
  cityId?: number | null;
  chisinauZoneId?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  coverageRadiusKm?: number;
  contactPhone?: string | null;
  contactEmail?: string | null;
  workingHours?: string | null;
  specializedBrands?: string[];
  categoryIds?: number[];
}

export interface AutoServiceProfileResponse {
  id: number;
  userId: number;
  businessName: string;
  description: string | null;
  address: string | null;
  cityId: number | null;
  cityName: string | null;
  latitude: number | null;
  longitude: number | null;
  coverageRadiusKm: number;
  contactPhone: string | null;
  contactEmail: string | null;
  workingHours: string | null;
  averageRating: string;
  reviewCount: number;
  isVerified: boolean;
  specializedBrands: string[];
  serviceCategories: CategoryResponse[];
  avatarUrl: string | null;
  createdAt: string;
}

// ─── Review ───────────────────────────────────────────────────────────────────

export interface ReviewRequest {
  repairRequestId: number;
  autoServiceUserId: number;
  rating: number;
  comment?: string | null;
}

export interface ReviewResponse {
  id: number;
  repairRequestId: number;
  customerId: number;
  customerName: string;
  autoServiceUserId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export interface SubscriptionResponse {
  id: number;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  freeRequestsLimit: number;
  freeRequestsUsed: number;
  startDate: string;
  endDate: string | null;
}

// ─── FCM ──────────────────────────────────────────────────────────────────────

export interface FcmTokenRequest {
  token: string;
  deviceType: DeviceType;
}

// ─── Car Makes & Models ───────────────────────────────────────────────────────

export interface CarMakeResponse {
  id: number;
  name: string;
}

export interface CarModelResponse {
  id: number;
  name: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface Page<T> {
  content: T[];
  page: {
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  };
}

// ─── Error ────────────────────────────────────────────────────────────────────

export interface ApiError {
  status: number;
  error: string;
  message: string;
  path: string;
}