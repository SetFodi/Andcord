// Types for the Andcord database schema

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  // Joined data
  requester?: Profile;
  addressee?: Profile;
}

export interface Post {
  id: string;
  author_id: string;
  content: string | null;
  media_urls: string[] | null;
  link_preview: LinkPreview | null;
  created_at: string;
  // Joined data
  author?: Profile;
  likes?: Like[];
  comments?: Comment[];
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
}

export interface LinkPreview {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  // Joined data
  author?: Profile;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_ids: string[];
  last_message_at: string;
  // Joined data
  participants?: Profile[];
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  media_url?: string;
  media_type?: string;
  created_at: string;
  // Joined data
  sender?: Profile;
}

export interface Group {
  id: string;
  name: string;
  avatar_url: string | null;
  owner_id: string;
  created_at: string;
  // Joined data
  owner?: Profile;
  members?: GroupMember[];
  member_count?: number;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  // Joined data
  user?: Profile;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  // Joined data
  sender?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'friend_request' | 'friend_accepted' | 'message' | 'group_invite';
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

// Database response types for Supabase
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      friendships: {
        Row: Friendship;
        Insert: Omit<Friendship, 'id' | 'created_at'>;
        Update: Partial<Omit<Friendship, 'id' | 'created_at'>>;
      };
      posts: {
        Row: Post;
        Insert: Omit<Post, 'id' | 'created_at'>;
        Update: Partial<Omit<Post, 'id' | 'author_id' | 'created_at'>>;
      };
      comments: {
        Row: Comment;
        Insert: Omit<Comment, 'id' | 'created_at'>;
        Update: Partial<Omit<Comment, 'id' | 'created_at'>>;
      };
      likes: {
        Row: Like;
        Insert: Omit<Like, 'id' | 'created_at'>;
        Update: never;
      };
      conversations: {
        Row: Conversation;
        Insert: Omit<Conversation, 'id' | 'last_message_at'>;
        Update: Partial<Omit<Conversation, 'id'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at'>;
        Update: never;
      };
      groups: {
        Row: Group;
        Insert: Omit<Group, 'id' | 'created_at'>;
        Update: Partial<Omit<Group, 'id' | 'owner_id' | 'created_at'>>;
      };
      group_members: {
        Row: GroupMember;
        Insert: Omit<GroupMember, 'joined_at'>;
        Update: Partial<Omit<GroupMember, 'group_id' | 'user_id' | 'joined_at'>>;
      };
      group_messages: {
        Row: GroupMessage;
        Insert: Omit<GroupMessage, 'id' | 'created_at'>;
        Update: never;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at' | 'read'>;
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>;
      };
    };
  };
};
