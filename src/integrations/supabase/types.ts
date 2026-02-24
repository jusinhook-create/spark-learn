export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          description: string | null
          icon: string
          id: string
          name: string
          unlock_condition: Json | null
        }
        Insert: {
          description?: string | null
          icon?: string
          id?: string
          name: string
          unlock_condition?: Json | null
        }
        Update: {
          description?: string | null
          icon?: string
          id?: string
          name?: string
          unlock_condition?: Json | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          created_at: string
          description: string | null
          hosted_by: string
          id: string
          is_live: boolean
          recording_url: string | null
          scheduled_at: string | null
          subject: string | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hosted_by: string
          id?: string
          is_live?: boolean
          recording_url?: string | null
          scheduled_at?: string | null
          subject?: string | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hosted_by?: string
          id?: string
          is_live?: boolean
          recording_url?: string | null
          scheduled_at?: string | null
          subject?: string | null
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: []
      }
      forum_messages: {
        Row: {
          content: string | null
          created_at: string
          forum_id: string
          id: string
          image_url: string | null
          message_type: string
          streak_data: Json | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          forum_id: string
          id?: string
          image_url?: string | null
          message_type?: string
          streak_data?: Json | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          forum_id?: string
          id?: string
          image_url?: string | null
          message_type?: string
          streak_data?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_messages_forum_id_fkey"
            columns: ["forum_id"]
            isOneToOne: false
            referencedRelation: "forums"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          content: string
          created_at: string
          forum_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          forum_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          forum_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_forum_id_fkey"
            columns: ["forum_id"]
            isOneToOne: false
            referencedRelation: "forums"
            referencedColumns: ["id"]
          },
        ]
      }
      forums: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          invite_code: string | null
          is_public: boolean
          subject: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          invite_code?: string | null
          is_public?: boolean
          subject?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          invite_code?: string | null
          is_public?: boolean
          subject?: string | null
          title?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          forum_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          forum_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          forum_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_forum_id_fkey"
            columns: ["forum_id"]
            isOneToOne: false
            referencedRelation: "forums"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          coins: number
          created_at: string
          display_name: string | null
          education_level: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          coins?: number
          created_at?: string
          display_name?: string | null
          education_level?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          coins?: number
          created_at?: string
          display_name?: string | null
          education_level?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer_index: number
          id: string
          options: Json
          order_index: number
          question_text: string
          quiz_id: string
        }
        Insert: {
          correct_answer_index?: number
          id?: string
          options?: Json
          order_index?: number
          question_text: string
          quiz_id: string
        }
        Update: {
          correct_answer_index?: number
          id?: string
          options?: Json
          order_index?: number
          question_text?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          coins_earned: number
          completed_at: string | null
          created_at: string
          id: string
          quiz_id: string
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          coins_earned?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          quiz_id: string
          score?: number
          total_questions?: number
          user_id: string
        }
        Update: {
          coins_earned?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          quiz_id?: string
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          coins_reward: number
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_published: boolean
          subject: string | null
          time_limit_seconds: number | null
          title: string
        }
        Insert: {
          coins_reward?: number
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_published?: boolean
          subject?: string | null
          time_limit_seconds?: number | null
          title: string
        }
        Update: {
          coins_reward?: number
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_published?: boolean
          subject?: string | null
          time_limit_seconds?: number | null
          title?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          code: string
          coins_awarded: boolean
          created_at: string
          id: string
          referred_id: string | null
          referrer_id: string
        }
        Insert: {
          code: string
          coins_awarded?: boolean
          created_at?: string
          id?: string
          referred_id?: string | null
          referrer_id: string
        }
        Update: {
          code?: string
          coins_awarded?: boolean
          created_at?: string
          id?: string
          referred_id?: string | null
          referrer_id?: string
        }
        Relationships: []
      }
      streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          user_id?: string
        }
        Relationships: []
      }
      study_materials: {
        Row: {
          created_at: string
          extracted_text: string | null
          file_type: string | null
          file_url: string | null
          id: string
          subject: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          extracted_text?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          subject?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          extracted_text?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          subject?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_notes: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_public: boolean
          subject: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          subject?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          subject?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard: {
        Row: {
          avatar_url: string | null
          coins: number | null
          current_streak: number | null
          display_name: string | null
          quizzes_completed: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
