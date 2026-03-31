export type Role = 'admin' | 'user';

export type Profile = {
  id: string;
  full_name: string | null;
  role: Role;
  is_active: boolean;
};

export type Device = {
  id: string;
  name: string;
  serial: string;
  location: string | null;
  owner_id: string | null;
  status: 'active' | 'inactive';
  last_seen: string | null;
};

export type Reading = {
  id: number;
  device_id: string;
  temperature: number;
  humidity: number;
  recorded_at: string;
};
