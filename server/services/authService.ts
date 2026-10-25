import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { User, AuthResponse } from '../../src/types/index.ts';
import { getStationById } from '../data/stations.ts';

const ALLOWED_ROLES = [
  'Environmental Consultant',
  'Municipal Sustainability Coordinator',
  'Environmental Data Analyst',
  'Regulatory Compliance Officer'
] as const;

const DEMO_PERSONAS = {
  consultant: 'consultant@apex-enviro.com',
  coordinator: 'coordinator@indy.gov',
  analyst: 'analyst@idem-audits.org'
} as const;

const PUBLISHED_SECRETS = new Set([
  'change-me-in-production',
  'your-own-dev-secret',
  'ecoinsight-indiana-pm25-secret-key-2026'
]);

// Development tokens are signed with a process-local secret so a published
// fallback cannot be used to forge sessions. Set JWT_SECRET to keep tokens
// valid across restarts.
const devJwtSecret = crypto.randomBytes(32).toString('hex');

export function assertJwtConfigured(): void {
  getJwtSecret();
}

function getJwtSecret(): string {
  const configured = process.env.JWT_SECRET?.trim();
  if (process.env.NODE_ENV === 'production') {
    if (!configured || configured.length < 24 || PUBLISHED_SECRETS.has(configured)) {
      throw new Error(
        'JWT_SECRET must be a unique value of at least 24 characters when NODE_ENV is production. Do not reuse the placeholder from .env.example.'
      );
    }
    return configured;
  }
  return configured || devJwtSecret;
}

const USERS_FILE = path.resolve(process.cwd(), 'server', 'data', 'users.json');

function unusablePasswordHash(): string {
  return bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 10);
}

interface StoredUser extends User {
  passwordHash: string;
}

// Demo profiles for development one-click sign-in. Their password hashes are
// random and are not derived from a published password.
function createSeedUsers(): StoredUser[] {
  return [
    {
      id: 'user-001',
      name: 'Sarah Jenkins, PE',
      email: 'consultant@apex-enviro.com',
      passwordHash: unusablePasswordHash(),
      organization: 'Apex Environmental Solutions LLC',
      role: 'Environmental Consultant',
      createdAt: '2026-01-15T08:00:00Z',
      defaultStationId: 'in-marion-0078'
    },
    {
      id: 'user-002',
      name: 'Marcus Vance',
      email: 'coordinator@indy.gov',
      passwordHash: unusablePasswordHash(),
      organization: 'City of Indianapolis Office of Sustainability',
      role: 'Municipal Sustainability Coordinator',
      createdAt: '2026-02-01T09:30:00Z',
      defaultStationId: 'in-marion-0078'
    },
    {
      id: 'user-003',
      name: 'Dr. Elena Rostova',
      email: 'analyst@idem-audits.org',
      passwordHash: unusablePasswordHash(),
      organization: 'IDEM Air Monitoring Quality Assurance',
      role: 'Environmental Data Analyst',
      createdAt: '2026-03-10T14:15:00Z',
      defaultStationId: 'in-lake-0022'
    }
  ];
}

let usersStore: StoredUser[] = [];

// Load or initialize users
function initializeUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      usersStore = JSON.parse(data);
    } else {
      usersStore = createSeedUsers();
      saveUsers();
    }
  } catch (err) {
    console.warn('Error reading users store, using seeds:', err);
    usersStore = createSeedUsers();
  }
}

function saveUsers() {
  try {
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save users store:', err);
  }
}

initializeUsers();

export function toPublicUser(u: StoredUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    organization: u.organization,
    role: u.role,
    createdAt: u.createdAt,
    defaultStationId: u.defaultStationId
  };
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      organization: user.organization
    },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any;
    const found = usersStore.find(u => u.id === decoded.id);
    return found ? toPublicUser(found) : null;
  } catch {
    return null;
  }
}

export async function loginUser(email: string, passwordPlain: string): Promise<AuthResponse> {
  if (typeof email !== 'string' || !email.trim()) {
    throw new Error('Email and password are required.');
  }
  if (typeof passwordPlain !== 'string' || !passwordPlain) {
    throw new Error('Email and password are required.');
  }
  const normalizedEmail = email.trim().toLowerCase();
  const user = usersStore.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    throw new Error('No user account registered with this email address.');
  }

  const matches = await bcrypt.compare(passwordPlain, user.passwordHash);
  if (!matches) {
    throw new Error('Invalid password provided.');
  }

  const publicUser = toPublicUser(user);
  const token = generateToken(publicUser);

  return {
    user: publicUser,
    token,
    message: `Welcome back, ${publicUser.name}!`
  };
}

export async function registerUser(params: {
  name: string;
  email: string;
  password: string;
  organization: string;
  role: 'Environmental Consultant' | 'Municipal Sustainability Coordinator' | 'Environmental Data Analyst' | 'Regulatory Compliance Officer';
  defaultStationId?: string;
}): Promise<AuthResponse> {
  const { name, email, password, organization, role, defaultStationId } = params;

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 120) {
    throw new Error('Please provide your full professional name.');
  }
  if (typeof email !== 'string') {
    throw new Error('Please provide a valid professional email address.');
  }
  if (!(ALLOWED_ROLES as readonly string[]).includes(role)) {
    throw new Error('Please select a valid professional role.');
  }
  if (defaultStationId && !getStationById(defaultStationId)) {
    throw new Error('The selected monitoring station is not in the Indiana registry.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    throw new Error('Please provide a valid professional email address.');
  }

  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }
  if (password.length > 128) {
    throw new Error('Password must be 128 characters or fewer.');
  }

  const exists = usersStore.some(u => u.email.toLowerCase() === normalizedEmail);
  if (exists) {
    throw new Error('An account with this email address already exists. Please log in.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser: StoredUser = {
    id: `user-${Date.now()}`,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    organization: (typeof organization === 'string' ? organization.trim().slice(0, 160) : '') || 'Indiana Air Quality Working Group',
    role,
    createdAt: new Date().toISOString(),
    defaultStationId: defaultStationId || 'in-marion-0078'
  };

  usersStore.push(newUser);
  saveUsers();

  const publicUser = toPublicUser(newUser);
  const token = generateToken(publicUser);

  return {
    user: publicUser,
    token,
    message: `Account created successfully. Welcome to EcoInsight Analytics, ${publicUser.name}!`
  };
}

export function loginDemoPersona(persona: string): AuthResponse {
  const email = DEMO_PERSONAS[persona as keyof typeof DEMO_PERSONAS];
  if (!email) {
    throw new Error('Unknown demo persona.');
  }
  const user = usersStore.find(u => u.email.toLowerCase() === email);
  if (!user) {
    throw new Error('Demo account is unavailable.');
  }
  const publicUser = toPublicUser(user);
  return {
    user: publicUser,
    token: generateToken(publicUser),
    message: `Welcome back, ${publicUser.name}!`
  };
}

export function updateUserPreferences(userId: string, defaultStationId: string): User {
  const user = usersStore.find(u => u.id === userId);
  if (!user) {
    throw new Error('User not found.');
  }
  if (typeof defaultStationId !== 'string' || !getStationById(defaultStationId)) {
    throw new Error('The selected monitoring station is not in the Indiana registry.');
  }
  user.defaultStationId = defaultStationId;
  saveUsers();
  return toPublicUser(user);
}
