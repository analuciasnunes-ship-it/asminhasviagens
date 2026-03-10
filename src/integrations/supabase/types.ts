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
      accommodations: {
        Row: {
          address: string | null
          check_in: string
          check_out: string
          created_at: string
          id: string
          paid_by: string | null
          place_name: string
          price: number | null
          shared_by: string[] | null
          trip_id: string
        }
        Insert: {
          address?: string | null
          check_in: string
          check_out: string
          created_at?: string
          id?: string
          paid_by?: string | null
          place_name: string
          price?: number | null
          shared_by?: string[] | null
          trip_id: string
        }
        Update: {
          address?: string | null
          check_in?: string
          check_out?: string
          created_at?: string
          id?: string
          paid_by?: string | null
          place_name?: string
          price?: number | null
          shared_by?: string[] | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accommodations_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          comments: string | null
          cost: number | null
          created_at: string
          day_id: string
          description: string | null
          estimated_duration: string | null
          id: string
          lat: number | null
          link: string | null
          lng: number | null
          location: string | null
          order_index: number | null
          paid_by: string | null
          rating: number | null
          shared_by: string[] | null
          status: string
          time: string | null
          time_locked: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          comments?: string | null
          cost?: number | null
          created_at?: string
          day_id: string
          description?: string | null
          estimated_duration?: string | null
          id?: string
          lat?: number | null
          link?: string | null
          lng?: number | null
          location?: string | null
          order_index?: number | null
          paid_by?: string | null
          rating?: number | null
          shared_by?: string[] | null
          status?: string
          time?: string | null
          time_locked?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          comments?: string | null
          cost?: number | null
          created_at?: string
          day_id?: string
          description?: string | null
          estimated_duration?: string | null
          id?: string
          lat?: number | null
          link?: string | null
          lng?: number | null
          location?: string | null
          order_index?: number | null
          paid_by?: string | null
          rating?: number | null
          shared_by?: string[] | null
          status?: string
          time?: string | null
          time_locked?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_photos: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          url: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          url: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_photos_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      days: {
        Row: {
          created_at: string
          date: string
          day_number: number
          id: string
          title: string | null
          trip_id: string
        }
        Insert: {
          created_at?: string
          date: string
          day_number: number
          id?: string
          title?: string | null
          trip_id: string
        }
        Update: {
          created_at?: string
          date?: string
          day_number?: number
          id?: string
          title?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "days_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_payments: {
        Row: {
          amount: number
          created_at: string
          date: string | null
          id: string
          paid_by: string | null
          parent_id: string
          parent_type: string
          status: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date?: string | null
          id?: string
          paid_by?: string | null
          parent_id: string
          parent_type: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string | null
          id?: string
          paid_by?: string | null
          parent_id?: string
          parent_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_payments_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          created_at: string
          day_id: string
          description: string
          id: string
          notes: string | null
          paid_by: string | null
          shared_by: string[] | null
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          day_id: string
          description: string
          id?: string
          notes?: string | null
          paid_by?: string | null
          shared_by?: string[] | null
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          day_id?: string
          description?: string
          id?: string
          notes?: string | null
          paid_by?: string | null
          shared_by?: string[] | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      flights: {
        Row: {
          arrival_time: string | null
          created_at: string
          departure_time: string | null
          destination: string
          flight_number: string | null
          id: string
          origin: string
          paid_by: string | null
          price: number | null
          return_arrival_time: string | null
          return_departure_time: string | null
          shared_by: string[] | null
          trip_id: string
          type: string
        }
        Insert: {
          arrival_time?: string | null
          created_at?: string
          departure_time?: string | null
          destination: string
          flight_number?: string | null
          id?: string
          origin: string
          paid_by?: string | null
          price?: number | null
          return_arrival_time?: string | null
          return_departure_time?: string | null
          shared_by?: string[] | null
          trip_id: string
          type?: string
        }
        Update: {
          arrival_time?: string | null
          created_at?: string
          departure_time?: string | null
          destination?: string
          flight_number?: string | null
          id?: string
          origin?: string
          paid_by?: string | null
          price?: number | null
          return_arrival_time?: string | null
          return_departure_time?: string | null
          shared_by?: string[] | null
          trip_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "flights_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flights_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          created_at: string
          day_id: string
          id: string
          notes: string | null
          paid_by: string | null
          rating: number | null
          restaurant_name: string
          shared_by: string[] | null
          time: string | null
          total_bill: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_id: string
          id?: string
          notes?: string | null
          paid_by?: string | null
          rating?: number | null
          restaurant_name: string
          shared_by?: string[] | null
          time?: string | null
          total_bill?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_id?: string
          id?: string
          notes?: string | null
          paid_by?: string | null
          rating?: number | null
          restaurant_name?: string
          shared_by?: string[] | null
          time?: string | null
          total_bill?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meals_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meals_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      other_details: {
        Row: {
          created_at: string
          description: string
          id: string
          notes: string | null
          paid_by: string | null
          price: number | null
          shared_by: string[] | null
          trip_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          notes?: string | null
          paid_by?: string | null
          price?: number | null
          shared_by?: string[] | null
          trip_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          paid_by?: string | null
          price?: number | null
          shared_by?: string[] | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "other_details_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "other_details_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          date: string
          from_participant: string
          id: string
          to_participant: string
          trip_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date: string
          from_participant: string
          id?: string
          to_participant: string
          trip_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          from_participant?: string
          id?: string
          to_participant?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_from_participant_fkey"
            columns: ["from_participant"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_to_participant_fkey"
            columns: ["to_participant"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rental_cars: {
        Row: {
          company: string
          created_at: string
          dropoff_date: string
          id: string
          paid_by: string | null
          pickup_date: string
          price: number | null
          shared_by: string[] | null
          trip_id: string
        }
        Insert: {
          company: string
          created_at?: string
          dropoff_date: string
          id?: string
          paid_by?: string | null
          pickup_date: string
          price?: number | null
          shared_by?: string[] | null
          trip_id: string
        }
        Update: {
          company?: string
          created_at?: string
          dropoff_date?: string
          id?: string
          paid_by?: string | null
          pickup_date?: string
          price?: number | null
          shared_by?: string[] | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_cars_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_cars_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_participants: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          profile_id: string | null
          status: Database["public"]["Enums"]["participant_status"]
          trip_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          profile_id?: string | null
          status?: Database["public"]["Enums"]["participant_status"]
          trip_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          profile_id?: string | null
          status?: Database["public"]["Enums"]["participant_status"]
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_participants_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          cover_image: string | null
          created_at: string
          created_by: string | null
          destination: string
          end_date: string
          id: string
          invite_token: string
          start_date: string
          updated_at: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          destination: string
          end_date: string
          id?: string
          invite_token?: string
          start_date: string
          updated_at?: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          destination?: string
          end_date?: string
          id?: string
          invite_token?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_trip_id_from_activity: {
        Args: { _activity_id: string }
        Returns: string
      }
      get_trip_id_from_day: { Args: { _day_id: string }; Returns: string }
      is_trip_participant: { Args: { _trip_id: string }; Returns: boolean }
      join_trip_by_token: { Args: { _invite_token: string }; Returns: Json }
    }
    Enums: {
      participant_status: "active" | "invited" | "pending"
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
      participant_status: ["active", "invited", "pending"],
    },
  },
} as const
