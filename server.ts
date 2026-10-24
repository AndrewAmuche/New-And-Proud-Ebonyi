/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Attendee {
  id: string;
  name: string;
  school: string;
  category: string;
  track: string;
  lga: string;
  email: string;
  phone: string;
  registeredAt: string;
  checkedIn: boolean;
  notes?: string;
}

// Initial seed data representing real Ebonyi students across secondary & tertiary institutions
const initialAttendees: Attendee[] = [
  {
    id: 'NPE-842911',
    name: 'Chukwuebuka Nweke',
    school: 'Ebonyi State University (EBSU), Abakaliki',
    category: 'Tertiary Student',
    track: 'AI, Code & Robotics',
    lga: 'Izzi',
    email: 'ebuka.nweke@gmail.com',
    phone: '+234 803 412 8890',
    registeredAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    checkedIn: true,
    notes: 'Interested in robotics hardware grant',
  },
  {
    id: 'NPE-319042',
    name: 'Chiamaka Umahi',
    school: 'Federal Government Girls College, Okposi',
    category: 'Secondary Student',
    track: 'Global Scholarships',
    lga: 'Ohaozara',
    email: 'chiamaka.umahi@yahoo.com',
    phone: '+234 814 902 1134',
    registeredAt: new Date(Date.now() - 3600000 * 24 * 2.5).toISOString(),
    checkedIn: false,
    notes: 'Aspiring Biomedical Scientist',
  },
  {
    id: 'NPE-904128',
    name: 'Kelechi Egwu Jr.',
    school: 'Government Technical College, Abakaliki',
    category: 'Secondary Student',
    track: 'Agri-Tech & Enterprise',
    lga: 'Ikwo',
    email: 'kelechi.egwu.tech@gmail.com',
    phone: '+234 706 551 2291',
    registeredAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    checkedIn: true,
    notes: 'Project: Cassava drone monitoring',
  },
  {
    id: 'NPE-158293',
    name: 'Blessing Ogbonna',
    school: 'Afikpo High School, Afikpo',
    category: 'Secondary Student',
    track: 'Creative Media & Design',
    lga: 'Afikpo North',
    email: 'blessing.ogbonna@outlook.com',
    phone: '+234 808 334 9901',
    registeredAt: new Date(Date.now() - 3600000 * 24 * 1.8).toISOString(),
    checkedIn: false,
    notes: 'Documentary filmmaker for local art',
  },
  {
    id: 'NPE-772019',
    name: 'Obinna Chukwu',
    school: 'Alex Ekwueme Federal University, Ndufu-Alike (AE-FUNAI)',
    category: 'Tertiary Student',
    track: 'Civic Leadership & Law',
    lga: 'Ikwo',
    email: 'obinna.chukwu@aefunai.edu.ng',
    phone: '+234 812 770 4432',
    registeredAt: new Date(Date.now() - 3600000 * 24 * 1.2).toISOString(),
    checkedIn: true,
    notes: 'Debate society president',
  },
  {
    id: 'NPE-623841',
    name: 'Ngozi Elechi',
    school: 'Holy Ghost Secondary School, Abakaliki',
    category: 'Secondary Student',
    track: 'AI, Code & Robotics',
    lga: 'Ebonyi',
    email: 'ngozi.elechi@gmail.com',
    phone: '+234 903 118 7765',
    registeredAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    checkedIn: false,
    notes: 'Python student developer',
  },
  {
    id: 'NPE-448102',
    name: 'Ifeanyi Alo',
    school: 'Ebonyi State College of Nursing Sciences, Uburu',
    category: 'Tertiary Student',
    track: 'Global Scholarships',
    lga: 'Ohaozara',
    email: 'ifeanyi.alo@health.ebsu.edu.ng',
    phone: '+234 805 229 0081',
    registeredAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    checkedIn: true,
    notes: 'Public health research',
  },
  {
    id: 'NPE-531980',
    name: 'Amarachi Igwe',
    school: 'Command Day Secondary School, Abakaliki',
    category: 'Secondary Student',
    track: 'Creative Media & Design',
    lga: 'Ezza South',
    email: 'amarachi.igwe22@gmail.com',
    phone: '+234 816 443 9087',
    registeredAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    checkedIn: false,
  },
  {
    id: 'NPE-229341',
    name: 'Somtochukwu Eze',
    school: 'Akanu Ibiam Federal Polytechnic, Unwana',
    category: 'Tertiary Student',
    track: 'Agri-Tech & Enterprise',
    lga: 'Afikpo South',
    email: 'somto.eze@unwana.edu.ng',
    phone: '+234 701 998 2210',
    registeredAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    checkedIn: true,
    notes: 'Solar grain drying initiative',
  },
];

// Persistent file storage path
const dataDir = path.resolve(__dirname, 'data');
const dataFile = path.resolve(dataDir, 'attendees.json');

function loadAttendees(): Attendee[] {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (fs.existsSync(dataFile)) {
      const data = fs.readFileSync(dataFile, 'utf-8');
      return JSON.parse(data);
    }
    fs.writeFileSync(dataFile, JSON.stringify(initialAttendees, null, 2));
    return initialAttendees;
  } catch (err) {
    console.error('Error loading attendees:', err);
    return initialAttendees;
  }
}

function saveAttendees(attendees: Attendee[]) {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(dataFile, JSON.stringify(attendees, null, 2));
  } catch (err) {
    console.error('Error saving attendees:', err);
  }
}

let attendees: Attendee[] = loadAttendees();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API: Get Attendees with search, filters, and stats
  app.get('/api/attendees', (req: Request, res: Response) => {
    const { search, track, lga, status, category } = req.query;

    let filtered = [...attendees];

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          a.school.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.phone.includes(q)
      );
    }

    if (track && typeof track === 'string' && track !== 'all') {
      filtered = filtered.filter((a) => a.track === track);
    }

    if (lga && typeof lga === 'string' && lga !== 'all') {
      filtered = filtered.filter((a) => a.lga === lga);
    }

    if (category && typeof category === 'string' && category !== 'all') {
      filtered = filtered.filter((a) => a.category === category);
    }

    if (status && typeof status === 'string' && status !== 'all') {
      if (status === 'checkedIn') {
        filtered = filtered.filter((a) => a.checkedIn);
      } else if (status === 'pending') {
        filtered = filtered.filter((a) => !a.checkedIn);
      }
    }

    // Sort by registration date descending
    filtered.sort(
      (a, b) =>
        new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
    );

    res.json({
      success: true,
      count: filtered.length,
      total: attendees.length,
      attendees: filtered,
    });
  });

  // API: Get Aggregate Summit Statistics
  app.get('/api/attendees/stats', (_req: Request, res: Response) => {
    const total = attendees.length;
    const checkedInCount = attendees.filter((a) => a.checkedIn).length;
    const pendingCount = total - checkedInCount;

    // Track distribution
    const trackCounts: Record<string, number> = {};
    // LGA distribution
    const lgaCounts: Record<string, number> = {};
    // Category distribution
    const categoryCounts: Record<string, number> = {};

    attendees.forEach((a) => {
      trackCounts[a.track] = (trackCounts[a.track] || 0) + 1;
      lgaCounts[a.lga] = (lgaCounts[a.lga] || 0) + 1;
      categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
    });

    res.json({
      success: true,
      stats: {
        totalRegistered: total,
        checkedIn: checkedInCount,
        pending: pendingCount,
        checkInRate: total > 0 ? Math.round((checkedInCount / total) * 100) : 0,
        trackDistribution: trackCounts,
        lgaDistribution: lgaCounts,
        categoryDistribution: categoryCounts,
      },
    });
  });

  // API: Register new Attendee
  app.post('/api/attendees', (req: Request, res: Response) => {
    const { name, school, category, track, lga, email, phone, notes } = req.body;

    if (!name || !school) {
      res.status(400).json({ success: false, error: 'Name and School are required' });
      return;
    }

    const newId = 'NPE-' + Math.floor(100000 + Math.random() * 900000);

    const newAttendee: Attendee = {
      id: newId,
      name: String(name).trim(),
      school: String(school).trim(),
      category: category || 'Secondary Student',
      track: track || 'AI, Code & Robotics',
      lga: lga || 'Abakaliki',
      email: email ? String(email).trim() : '',
      phone: phone ? String(phone).trim() : '',
      registeredAt: new Date().toISOString(),
      checkedIn: false,
      notes: notes ? String(notes).trim() : '',
    };

    attendees.unshift(newAttendee);
    saveAttendees(attendees);

    res.status(201).json({
      success: true,
      attendee: newAttendee,
      message: 'Student successfully registered for New and Proud Ebonyi Summit',
    });
  });

  // API: Toggle Check-in status
  app.post('/api/attendees/:id/checkin', (req: Request, res: Response) => {
    const { id } = req.params;
    const attendee = attendees.find((a) => a.id.toLowerCase() === id.toLowerCase());

    if (!attendee) {
      res.status(404).json({ success: false, error: 'Attendee not found' });
      return;
    }

    attendee.checkedIn = !attendee.checkedIn;
    saveAttendees(attendees);

    res.json({
      success: true,
      attendee,
      message: attendee.checkedIn
        ? `${attendee.name} marked as CHECKED-IN`
        : `${attendee.name} check-in reverted to PENDING`,
    });
  });

  // API: Update Attendee
  app.put('/api/attendees/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = attendees.findIndex((a) => a.id.toLowerCase() === id.toLowerCase());

    if (index === -1) {
      res.status(404).json({ success: false, error: 'Attendee not found' });
      return;
    }

    attendees[index] = {
      ...attendees[index],
      ...req.body,
      id: attendees[index].id, // keep immutable id
    };

    saveAttendees(attendees);

    res.json({
      success: true,
      attendee: attendees[index],
      message: 'Attendee details updated',
    });
  });

  // API: Delete Attendee
  app.delete('/api/attendees/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const initialLen = attendees.length;
    attendees = attendees.filter((a) => a.id.toLowerCase() !== id.toLowerCase());

    if (attendees.length === initialLen) {
      res.status(404).json({ success: false, error: 'Attendee not found' });
      return;
    }

    saveAttendees(attendees);

    res.json({
      success: true,
      message: 'Attendee deleted successfully',
    });
  });

  // API: Export Attendees to CSV
  app.get('/api/attendees/export/csv', (_req: Request, res: Response) => {
    const headers = [
      'Pass ID',
      'Full Name',
      'School / Institution',
      'Category',
      'Track',
      'LGA',
      'Email',
      'Phone',
      'Registration Date',
      'Checked In',
      'Notes',
    ];

    const rows = attendees.map((a) => [
      `"${a.id}"`,
      `"${a.name.replace(/"/g, '""')}"`,
      `"${a.school.replace(/"/g, '""')}"`,
      `"${a.category}"`,
      `"${a.track}"`,
      `"${a.lga}"`,
      `"${a.email}"`,
      `"${a.phone}"`,
      `"${new Date(a.registeredAt).toLocaleString()}"`,
      a.checkedIn ? '"Yes"' : '"No"',
      `"${(a.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join(
      '\n'
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="New_and_Proud_Ebonyi_Attendees.csv"'
    );
    res.send(csvContent);
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Summit Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
