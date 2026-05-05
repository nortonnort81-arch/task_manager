export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          notes: string | null;
          due_at: string | null;
          completed: boolean;
          image_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          notes?: string | null;
          due_at?: string | null;
          completed?: boolean;
          image_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          notes?: string | null;
          due_at?: string | null;
          completed?: boolean;
          image_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

export type TaskRow = Database['public']['Tables']['tasks']['Row'];
