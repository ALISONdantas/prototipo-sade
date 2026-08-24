import { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';

export function useConfirmExitOnBack(shouldConfirm: boolean, onExit?: () => void) {
  const navigation = useNavigation();
  const [pendingAction, setPendingAction] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!shouldConfirm) return;
      e.preventDefault();
      setPendingAction(e.data.action);
    });

    return unsubscribe;
  }, [navigation, shouldConfirm]);

  const confirmExit = useCallback(() => {
    if (!pendingAction) return;
    onExit?.();
    navigation.dispatch(pendingAction);
    setPendingAction(null);
  }, [navigation, pendingAction, onExit]);

  const cancelExit = useCallback(() => setPendingAction(null), []);

  return { isConfirmVisible: !!pendingAction, confirmExit, cancelExit };
}
