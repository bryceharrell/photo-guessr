import ChallengeCreatedScreen from '@/components/ChallengeCreatedScreen'

export default async function ChallengeCreatedPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ChallengeCreatedScreen challengeId={id} />
}
