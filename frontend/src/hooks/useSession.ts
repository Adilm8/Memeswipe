import { useSessionContext } from '@/context/SessionContext';

export const useSession = () => {
  return useSessionContext();
};
