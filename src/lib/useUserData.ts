import { useAuth, useOrganization, useUser } from '@clerk/react';
import { useMemo } from 'react';

export function useUserData() {
  const { userId } = useAuth();
  const { user } = useUser();
  const { organization } = useOrganization();

  const clerkUserId = userId || '';
  const orgId = organization?.id || undefined;

  const planId = useMemo(() => {
    const orgPub = organization?.publicMetadata as any;
    const userPub = user?.publicMetadata as any;
    const userUnsafe = user?.unsafeMetadata as any;

    if (orgPub?.planId && orgPub.planId !== 'free_trial') return orgPub.planId as string;
    if (userPub?.planId && userPub.planId !== 'free_trial') return userPub.planId as string;
    if (userUnsafe?.planId && userUnsafe.planId !== 'free_trial') return userUnsafe.planId as string;
    if (orgPub?.planId === 'free_trial') return 'free_trial';

    return 'free_trial';
  }, [organization, user]);

  const expiresAt = useMemo(() => {
    const orgPub = organization?.publicMetadata as any;
    const userUnsafe = user?.unsafeMetadata as any;
    const userPub = user?.publicMetadata as any;

    let meta: any = null;
    if (orgPub?.planId && orgPub.planId !== 'free_trial') meta = orgPub;
    else if (userUnsafe?.planId && userUnsafe.planId !== 'free_trial') meta = userUnsafe;
    else meta = userPub;

    return meta?.expiresAt ? new Date(meta.expiresAt) : null;
  }, [organization, user]);

  const isPremium = useMemo(() => {
    const pid = planId?.toLowerCase();
    const hasPaidPlan = pid === 'basic' || pid === 'premium';
    if (!hasPaidPlan) return false;
    if (expiresAt && new Date() > expiresAt) return false;
    return true;
  }, [planId, expiresAt]);

  return {
    clerkUserId,
    orgId,
    isPremium,
    planId,
  };
}
