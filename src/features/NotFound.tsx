import { Compass } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { ButtonLink } from '@/components/ui';

export default function NotFoundPage() {
  return (
    <div className="py-10">
      <h1 className="sr-only">Page not found</h1>
      <EmptyState
        icon={Compass}
        title="This page is off the flight plan"
        description="The address does not match any screen in the prototype. Head home to pick a tour, or use Ctrl or Cmd + K to jump anywhere."
        action={
          <ButtonLink to="/" variant="primary">
            Go to Home
          </ButtonLink>
        }
      />
    </div>
  );
}
