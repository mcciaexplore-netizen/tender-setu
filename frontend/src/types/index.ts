export type TenderCategoryCode =
  | 'CONSTRUCTION'
  | 'IT_SERVICES'
  | 'MEDICAL'
  | 'ELECTRICAL'
  | 'STATIONERY'
  | 'TRANSPORTATION'
  | 'PLUMBING'
  | 'CONSULTING'
  | 'OTHER';

export type TenderStatusCode = 'OPEN' | 'CLOSING_SOON' | 'CLOSED' | 'CANCELLED';
export type TenderStageCode = 'DISCOVERED' | 'EVALUATING' | 'PREPARING' | 'SUBMITTED' | 'AWARDED';
export type AlertChannel = 'EMAIL' | 'SMS' | 'WHATSAPP';
export type AlertFrequency = 'INSTANT' | 'DAILY_DIGEST' | 'WEEKLY_DIGEST';

export interface Tender {
  id: string;
  title: string;
  referenceNumber: string;
  issuingAuthority: string;
  department: string;
  description: string;
  category: TenderCategoryCode;
  state: string;
  district: string;
  city?: string;
  estimatedValue: number | null;
  emdAmount: number | null;
  publishedDate: string;
  submissionDeadline: string;
  prebidMeetingDate?: string | null;
  tenderDocUrl: string;
  sourceUrl: string;
  sourcePortal: string;
  status: TenderStatusCode;
}

export interface AlertItem {
  id: string;
  name: string;
  categories: TenderCategoryCode[];
  states: string[];
  minValue: number | null;
  maxValue: number | null;
  keywords: string[];
  isActive: boolean;
  channel: AlertChannel;
  frequency: AlertFrequency;
}

export interface BookmarkItem {
  id: string;
  tenderId: string;
  stage: TenderStageCode;
  notes?: string | null;
  tender?: Tender;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  companyName?: string | null;
  state?: string | null;
  district?: string | null;
  preferredCategories?: TenderCategoryCode[];
  preferredStates?: string[];
  isVerified?: boolean;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  companyName: string;
  state: string;
  district: string;
  preferredCategories?: TenderCategoryCode[];
  preferredStates?: string[];
  udyamNumber?: string;
  gstNumber?: string;
  turnover?: number;
}

export interface TenderQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: TenderCategoryCode;
  state?: string;
  minValue?: number;
  maxValue?: number;
  deadline?: 7 | 15 | 30;
  status?: 'OPEN' | 'CLOSING_SOON';
  sort?: 'publishedDate' | 'submissionDeadline' | 'estimatedValue';
}

export interface PaginatedTenders {
  data: Tender[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
