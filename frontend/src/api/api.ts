import { alertSeed, bookmarkSeed, tenders } from '../data/mockData';
import type {
  AlertItem,
  BookmarkItem,
  PaginatedTenders,
  RegisterInput,
  Tender,
  TenderQueryParams,
  TenderStageCode,
  User,
} from '../types';

const API_BASE = 'http://localhost:3000/api';
const TOKEN_KEY = 'tendersetu_token';
const BOOKMARKS_KEY = 'tendersetu_bookmarks';
const ALERTS_KEY = 'tendersetu_alerts';

const getToken = () => window.localStorage.getItem(TOKEN_KEY);

const buildHeaders = (withAuth = false) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (withAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const safeJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let message = `API request failed with status ${response.status}`;
    try {
      const errorBody = (await response.json()) as { error?: string; message?: string };
      message = errorBody.error ?? errorBody.message ?? message;
    } catch {
      // no-op
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
};

const getLocal = <T>(key: string, fallback: T): T => {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

const setLocal = <T>(key: string, value: T) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

const mapTender = (raw: Record<string, unknown>): Tender => ({
  id: String(raw.id),
  title: String(raw.title ?? ''),
  referenceNumber: String(raw.referenceNumber ?? ''),
  issuingAuthority: String(raw.issuingAuthority ?? ''),
  department: String(raw.department ?? ''),
  description: String(raw.description ?? ''),
  category: String(raw.category ?? 'OTHER') as Tender['category'],
  state: String(raw.state ?? ''),
  district: String(raw.district ?? ''),
  city: raw.city ? String(raw.city) : '',
  estimatedValue: raw.estimatedValue === null || raw.estimatedValue === undefined ? null : Number(raw.estimatedValue),
  emdAmount: raw.emdAmount === null || raw.emdAmount === undefined ? null : Number(raw.emdAmount),
  publishedDate: String(raw.publishedDate ?? ''),
  submissionDeadline: String(raw.submissionDeadline ?? ''),
  prebidMeetingDate: raw.prebidMeetingDate ? String(raw.prebidMeetingDate) : null,
  tenderDocUrl: String(raw.tenderDocUrl ?? ''),
  sourceUrl: String(raw.sourceUrl ?? ''),
  sourcePortal: String(raw.sourcePortal ?? 'OTHER'),
  status: String(raw.status ?? 'OPEN') as Tender['status'],
});

const mapBookmark = (raw: Record<string, unknown>): BookmarkItem => ({
  id: String(raw.id),
  tenderId: String(raw.tenderId),
  stage: String(raw.stage) as TenderStageCode,
  notes: raw.notes ? String(raw.notes) : null,
  tender: raw.tender && typeof raw.tender === 'object' ? mapTender(raw.tender as Record<string, unknown>) : undefined,
});

const mapAlert = (raw: Record<string, unknown>): AlertItem => ({
  id: String(raw.id),
  name: String(raw.name ?? ''),
  categories: Array.isArray(raw.categories) ? (raw.categories as AlertItem['categories']) : [],
  states: Array.isArray(raw.states) ? raw.states.map(String) : [],
  minValue: raw.minValue === null || raw.minValue === undefined ? null : Number(raw.minValue),
  maxValue: raw.maxValue === null || raw.maxValue === undefined ? null : Number(raw.maxValue),
  keywords: Array.isArray(raw.keywords) ? raw.keywords.map(String) : [],
  isActive: Boolean(raw.isActive),
  channel: String(raw.channel ?? 'EMAIL') as AlertItem['channel'],
  frequency: String(raw.frequency ?? 'DAILY_DIGEST') as AlertItem['frequency'],
});

const toQueryString = (params: TenderQueryParams) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  return query.toString();
};

export const api = {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ email, password }),
      });
      return safeJson<{ token: string; user: User }>(response);
    } catch {
      return {
        token: 'demo-jwt-token',
        user: { id: 'user-1', name: 'Aarav Procurement', email, companyName: 'TenderSetu Demo Pvt Ltd' },
      };
    }
  },

  async register(payload: RegisterInput): Promise<{ token: string; user: User }> {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(payload),
      });
      return safeJson<{ token: string; user: User }>(response);
    } catch {
      return {
        token: 'demo-jwt-token',
        user: {
          id: 'user-1',
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          companyName: payload.companyName,
          state: payload.state,
          district: payload.district,
          preferredCategories: payload.preferredCategories ?? [],
          preferredStates: payload.preferredStates ?? [],
        },
      };
    }
  },

  async getTenders(params: TenderQueryParams = {}): Promise<PaginatedTenders> {
    try {
      const query = toQueryString(params);
      const response = await fetch(`${API_BASE}/tenders${query ? `?${query}` : ''}`);
      const payload = await safeJson<{ data: Record<string, unknown>[]; pagination: PaginatedTenders['pagination'] }>(
        response,
      );
      return {
        data: payload.data.map(mapTender),
        pagination: payload.pagination,
      };
    } catch {
      return {
        data: tenders,
        pagination: {
          page: params.page ?? 1,
          limit: params.limit ?? tenders.length,
          total: tenders.length,
          pages: 1,
        },
      };
    }
  },

  async getTenderById(id: string): Promise<Tender | undefined> {
    try {
      const response = await fetch(`${API_BASE}/tenders/${id}`);
      const payload = await safeJson<{ data: Record<string, unknown> }>(response);
      return mapTender(payload.data);
    } catch {
      return tenders.find((tender) => tender.id === id);
    }
  },

  async getTenderStats(): Promise<{ totalActive: number; closingThisWeek: number }> {
    try {
      const response = await fetch(`${API_BASE}/tenders/stats`);
      return safeJson<{ totalActive: number; closingThisWeek: number }>(response);
    } catch {
      return {
        totalActive: tenders.length,
        closingThisWeek: tenders.filter((item) => new Date(item.submissionDeadline).getTime() >= Date.now()).length,
      };
    }
  },

  async getBookmarks(): Promise<BookmarkItem[]> {
    try {
      const response = await fetch(`${API_BASE}/bookmarks`, {
        headers: buildHeaders(true),
      });
      const payload = await safeJson<{ data: Record<string, unknown>[] }>(response);
      return payload.data.map(mapBookmark);
    } catch {
      return getLocal<BookmarkItem[]>(BOOKMARKS_KEY, bookmarkSeed);
    }
  },

  async saveBookmark(tenderId: string, stage: TenderStageCode): Promise<BookmarkItem[]> {
    try {
      const current = await this.getBookmarks();
      const existing = current.find((item) => item.tenderId === tenderId);

      if (existing) {
        const response = await fetch(`${API_BASE}/bookmarks/${existing.id}`, {
          method: 'PATCH',
          headers: buildHeaders(true),
          body: JSON.stringify({ stage }),
        });
        await safeJson<{ data: Record<string, unknown> }>(response);
      } else {
        const response = await fetch(`${API_BASE}/bookmarks`, {
          method: 'POST',
          headers: buildHeaders(true),
          body: JSON.stringify({ tenderId, stage }),
        });
        await safeJson<{ data: Record<string, unknown> }>(response);
      }

      return this.getBookmarks();
    } catch {
      const bookmarks = getLocal<BookmarkItem[]>(BOOKMARKS_KEY, bookmarkSeed);
      const existing = bookmarks.find((item) => item.tenderId === tenderId);
      const nextBookmarks = existing
        ? bookmarks.map((item) => (item.tenderId === tenderId ? { ...item, stage } : item))
        : [...bookmarks, { id: `bm-${Date.now()}`, tenderId, stage }];
      setLocal(BOOKMARKS_KEY, nextBookmarks);
      return nextBookmarks;
    }
  },

  async getAlerts(): Promise<AlertItem[]> {
    try {
      const response = await fetch(`${API_BASE}/alerts`, {
        headers: buildHeaders(true),
      });
      const payload = await safeJson<{ data: Record<string, unknown>[] }>(response);
      return payload.data.map(mapAlert);
    } catch {
      return getLocal<AlertItem[]>(ALERTS_KEY, alertSeed);
    }
  },

  async toggleAlert(id: string): Promise<AlertItem[]> {
    try {
      const alerts = await this.getAlerts();
      const current = alerts.find((alert) => alert.id === id);
      if (!current) return alerts;

      const response = await fetch(`${API_BASE}/alerts/${id}`, {
        method: 'PATCH',
        headers: buildHeaders(true),
        body: JSON.stringify({ isActive: !current.isActive }),
      });
      await safeJson<{ data: Record<string, unknown> }>(response);
      return this.getAlerts();
    } catch {
      const alerts = getLocal<AlertItem[]>(ALERTS_KEY, alertSeed);
      const nextAlerts = alerts.map((alert) => (alert.id === id ? { ...alert, isActive: !alert.isActive } : alert));
      setLocal(ALERTS_KEY, nextAlerts);
      return nextAlerts;
    }
  },
};
