import { redirect } from 'next/navigation';

// This page redirects to home with the project selected
// The main app handles the URL state via router.push
export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  redirect(`/?project=${params.id}`);
}
