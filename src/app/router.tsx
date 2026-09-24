import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { RouteErrorBoundary } from './ErrorBoundary';
import { AppLayout } from './Layout';

const HomePage = lazy(() => import('@/features/home/HomePage'));
const StrategyPage = lazy(() => import('@/features/strategy/StrategyPage'));
const ResearchPage = lazy(() => import('@/features/research/ResearchPage'));
const ProcessPage = lazy(() => import('@/features/process/ProcessPage'));
const BriefPage = lazy(() => import('@/features/cfo/BriefPage'));
const ClosePage = lazy(() => import('@/features/cfo/ClosePage'));
const ExceptionDetailPage = lazy(() => import('@/features/cfo/ExceptionDetailPage'));
const AutonomyPage = lazy(() => import('@/features/cfo/AutonomyPage'));
const ExpertSessionPage = lazy(() => import('@/features/cfo/ExpertSessionPage'));
const AskPage = lazy(() => import('@/features/cfo/AskPage'));
const StorePage = lazy(() => import('@/features/cfo/StorePage'));
const AgentDetailPage = lazy(() => import('@/features/cfo/AgentDetailPage'));
const FlightLogPage = lazy(() => import('@/features/cfo/FlightLogPage'));
const HangarPage = lazy(() => import('@/features/dev/HangarPage'));
const ExplorerPage = lazy(() => import('@/features/dev/ExplorerPage'));
const StudioPage = lazy(() => import('@/features/dev/StudioPage'));
const PublishPage = lazy(() => import('@/features/dev/PublishPage'));
const EarningsPage = lazy(() => import('@/features/dev/EarningsPage'));
const NotFoundPage = lazy(() => import('@/features/NotFound'));

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/strategy', element: <StrategyPage /> },
      { path: '/research', element: <ResearchPage /> },
      { path: '/process', element: <ProcessPage /> },
      { path: '/cfo', element: <BriefPage /> },
      { path: '/cfo/brief', element: <BriefPage /> },
      { path: '/cfo/close', element: <ClosePage /> },
      { path: '/cfo/close/:itemId', element: <ExceptionDetailPage /> },
      { path: '/cfo/autonomy', element: <AutonomyPage /> },
      { path: '/cfo/experts/:sessionId', element: <ExpertSessionPage /> },
      { path: '/cfo/ask', element: <AskPage /> },
      { path: '/cfo/store', element: <StorePage /> },
      { path: '/cfo/store/:agentId', element: <AgentDetailPage /> },
      { path: '/cfo/flight-log', element: <FlightLogPage /> },
      { path: '/dev', element: <HangarPage /> },
      { path: '/dev/explorer', element: <ExplorerPage /> },
      { path: '/dev/studio', element: <StudioPage /> },
      { path: '/dev/publish', element: <PublishPage /> },
      { path: '/dev/earnings', element: <EarningsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
