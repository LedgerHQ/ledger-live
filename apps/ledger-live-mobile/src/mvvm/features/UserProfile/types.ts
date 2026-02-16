export interface UserProfile {
  readonly name: string;
  readonly email: string;
  readonly avatarUrl: string | undefined;
  readonly createdAt: string;
}

export interface UserProfileScreenProps {
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly profile: UserProfile | undefined;
  readonly onEditPress: () => void;
  readonly onLogoutPress: () => void;
}
