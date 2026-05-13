# ClinicQueue

ClinicQueue is an AI-powered smart patient queue management system designed for clinics and hospitals. Instead of following a simple first-come-first-serve model, ClinicQueue analyzes patient symptoms using AI triage to prioritize critical cases in real time.

## Tech Stack

- **Frontend**: React with Vite
- **Backend**: Express.js
- **Database**: MongoDB
- **Cache**: Redis
- **Real-time Communication**: Socket.io
- **AI Services**: LLM for triage, Whisper API for voice-to-text
- **SMS Notifications**: Twilio
- **State Management**: Zustand
- **Internationalization**: i18n (English and Hindi)

## Folder Structure

```
clinicqueue/
│
├── client/                        ← React frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/            ← Button, Input, Modal, Badge
│   │   │   ├── patient/           ← SymptomForm, TokenCard, QueueStatus
│   │   │   └── doctor/            ← QueueDashboard, PatientSummaryCard
│   │   ├── pages/
│   │   │   ├── PatientEntry.jsx   ← Voice/text symptom input
│   │   │   ├── TokenConfirm.jsx   ← Shows token + queue position
│   │   │   ├── DoctorDashboard.jsx
│   │   │   └── AdminPanel.jsx
│   │   ├── hooks/
│   │   │   ├── useSocket.js       ← Real-time queue updates
│   │   │   └── useVoiceInput.js   ← Web Speech API wrapper
│   │   ├── store/
│   │   │   └── queueStore.js      ← Zustand global state
│   │   ├── services/
│   │   │   └── api.js             ← Axios instance + endpoints
│   │   ├── i18n/
│   │   │   ├── en.json
│   │   │   └── hi.json            ← Hindi translations
│   │   └── App.jsx
│
├── server/                        ← Express backend
│   ├── config/
│   │   ├── db.js                  ← MongoDB connection
│   │   └── redis.js               ← Redis client
│   ├── controllers/
│   │   ├── patientController.js
│   │   ├── triageController.js    ← AI triage logic lives here
│   │   ├── queueController.js
│   │   └── authController.js
│   ├── models/
│   │   ├── Patient.js
│   │   ├── TriageRecord.js
│   │   ├── QueueEntry.js
│   │   └── Doctor.js
│   ├── routes/
│   │   ├── patientRoutes.js
│   │   ├── triageRoutes.js
│   │   ├── queueRoutes.js
│   │   └── authRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js      ← JWT verify
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   ├── services/
│   │   ├── aiTriageService.js     ← Calls LLM, returns severity 1–5
│   │   ├── whisperService.js      ← Audio → text via Whisper API
│   │   ├── smsService.js          ← Twilio SMS token notification
│   │   └── queueService.js        ← Priority queue logic (Redis)
│   ├── sockets/
│   │   └── queueSocket.js         ← Socket.io event handlers
│   ├── prompts/
│   │   └── triagePrompt.js        ← LLM system prompt (the crown jewel)
│   └── server.js
│
├── .env
├── docker-compose.yml
└── README.md
```
