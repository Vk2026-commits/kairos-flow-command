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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      consulting_action_items: {
        Row: {
          created_at: string
          data: Json
          id: string
          occurred_on: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      consulting_activities: {
        Row: {
          created_at: string
          data: Json
          id: string
          occurred_on: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      consulting_before_after: {
        Row: {
          created_at: string
          data: Json
          id: string
          occurred_on: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      consulting_milestones: {
        Row: {
          created_at: string
          data: Json
          id: string
          occurred_on: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      consulting_notes: {
        Row: {
          created_at: string
          data: Json
          id: string
          occurred_on: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      consulting_project: {
        Row: {
          created_at: string
          data: Json
          id: string
          next_action: string | null
          phase: string
          progress_pct: number
          status: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          next_action?: string | null
          phase?: string
          progress_pct?: number
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          next_action?: string | null
          phase?: string
          progress_pct?: number
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      consulting_recommendations: {
        Row: {
          created_at: string
          data: Json
          id: string
          occurred_on: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      consulting_site_visits: {
        Row: {
          created_at: string
          data: Json
          id: string
          occurred_on: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      device_access_codes: {
        Row: {
          code: string
          created_at: string
          label: string | null
          last_used_at: string | null
          revoked: boolean
          role: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          label?: string | null
          last_used_at?: string | null
          revoked?: boolean
          role?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          label?: string | null
          last_used_at?: string | null
          revoked?: boolean
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          content_type: string | null
          created_at: string
          description: string | null
          file_size: number | null
          id: string
          meta: string | null
          storage_path: string
          title: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          description?: string | null
          file_size?: number | null
          id?: string
          meta?: string | null
          storage_path: string
          title: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          description?: string | null
          file_size?: number | null
          id?: string
          meta?: string | null
          storage_path?: string
          title?: string
        }
        Relationships: []
      }
      kairos_state: {
        Row: {
          data: Json
          key: string
          updated_at: string
        }
        Insert: {
          data?: Json
          key: string
          updated_at?: string
        }
        Update: {
          data?: Json
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      traffic_plans: {
        Row: {
          annotations: Json
          base: string
          created_at: string
          id: string
          layers: Json
          live_map_type: string | null
          live_view: Json | null
          name: string
          saved_at: number
          service: string | null
          street_view: boolean | null
          updated_at: string
        }
        Insert: {
          annotations?: Json
          base: string
          created_at?: string
          id?: string
          layers?: Json
          live_map_type?: string | null
          live_view?: Json | null
          name: string
          saved_at?: number
          service?: string | null
          street_view?: boolean | null
          updated_at?: string
        }
        Update: {
          annotations?: Json
          base?: string
          created_at?: string
          id?: string
          layers?: Json
          live_map_type?: string | null
          live_view?: Json | null
          name?: string
          saved_at?: number
          service?: string | null
          street_view?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      vip_activity_log: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          details: string | null
          guest_name: string | null
          id: string
          visit_id: string | null
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          details?: string | null
          guest_name?: string | null
          id?: string
          visit_id?: string | null
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          details?: string | null
          guest_name?: string | null
          id?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vip_activity_log_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "vip_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_guests: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          guest_title: string | null
          guest_type: string
          id: string
          organization: string | null
          phone: string | null
          photo_path: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          guest_title?: string | null
          guest_type?: string
          id?: string
          organization?: string | null
          phone?: string | null
          photo_path?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          guest_title?: string | null
          guest_type?: string
          id?: string
          organization?: string | null
          phone?: string | null
          photo_path?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      vip_notes: {
        Row: {
          actor: string | null
          category: string | null
          created_at: string
          id: string
          note: string
          visit_id: string
        }
        Insert: {
          actor?: string | null
          category?: string | null
          created_at?: string
          id?: string
          note?: string
          visit_id: string
        }
        Update: {
          actor?: string | null
          category?: string | null
          created_at?: string
          id?: string
          note?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_notes_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "vip_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_parking_assignments: {
        Row: {
          ada_required: boolean
          arrival_route: string | null
          created_at: string
          drop_off: string | null
          escort_required: boolean
          exit_route: string | null
          gate: string | null
          golf_cart_required: boolean
          id: string
          instructions: string | null
          linked_plan: string | null
          lot: string | null
          reserved_area: string | null
          space_zone: string | null
          updated_at: string
          visit_id: string
        }
        Insert: {
          ada_required?: boolean
          arrival_route?: string | null
          created_at?: string
          drop_off?: string | null
          escort_required?: boolean
          exit_route?: string | null
          gate?: string | null
          golf_cart_required?: boolean
          id?: string
          instructions?: string | null
          linked_plan?: string | null
          lot?: string | null
          reserved_area?: string | null
          space_zone?: string | null
          updated_at?: string
          visit_id: string
        }
        Update: {
          ada_required?: boolean
          arrival_route?: string | null
          created_at?: string
          drop_off?: string | null
          escort_required?: boolean
          exit_route?: string | null
          gate?: string | null
          golf_cart_required?: boolean
          id?: string
          instructions?: string | null
          linked_plan?: string | null
          lot?: string | null
          reserved_area?: string | null
          space_zone?: string | null
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_parking_assignments_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "vip_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_status_history: {
        Row: {
          actor: string | null
          created_at: string
          id: string
          note: string | null
          status: string
          visit_id: string
        }
        Insert: {
          actor?: string | null
          created_at?: string
          id?: string
          note?: string | null
          status: string
          visit_id: string
        }
        Update: {
          actor?: string | null
          created_at?: string
          id?: string
          note?: string | null
          status?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_status_history_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "vip_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_vehicles: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          driver_company: string | null
          driver_name: string | null
          driver_on_site: boolean
          driver_phone: string | null
          driver_vehicle: string | null
          id: string
          make: string | null
          model: string | null
          plate: string | null
          updated_at: string
          vehicle_type: string | null
          visit_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          driver_company?: string | null
          driver_name?: string | null
          driver_on_site?: boolean
          driver_phone?: string | null
          driver_vehicle?: string | null
          id?: string
          make?: string | null
          model?: string | null
          plate?: string | null
          updated_at?: string
          vehicle_type?: string | null
          visit_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          driver_company?: string | null
          driver_name?: string | null
          driver_on_site?: boolean
          driver_phone?: string | null
          driver_vehicle?: string | null
          id?: string
          make?: string | null
          model?: string | null
          plate?: string | null
          updated_at?: string
          vehicle_type?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_vehicles_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "vip_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_visits: {
        Row: {
          arrival_method: string
          arrived_at: string | null
          arrived_by: string | null
          created_at: string
          data: Json
          departed_at: string | null
          departed_by: string | null
          departing_at: string | null
          departing_by: string | null
          departure_notes: string | null
          event: string | null
          expected_arrival: string | null
          expected_departure: string | null
          guest_id: string
          host_name: string | null
          host_phone: string | null
          id: string
          internal_notes: string | null
          parked_at: string | null
          parked_by: string | null
          party_size: number
          received_at: string | null
          received_by: string | null
          special_instructions: string | null
          status: string
          updated_at: string
          visit_date: string
        }
        Insert: {
          arrival_method?: string
          arrived_at?: string | null
          arrived_by?: string | null
          created_at?: string
          data?: Json
          departed_at?: string | null
          departed_by?: string | null
          departing_at?: string | null
          departing_by?: string | null
          departure_notes?: string | null
          event?: string | null
          expected_arrival?: string | null
          expected_departure?: string | null
          guest_id: string
          host_name?: string | null
          host_phone?: string | null
          id?: string
          internal_notes?: string | null
          parked_at?: string | null
          parked_by?: string | null
          party_size?: number
          received_at?: string | null
          received_by?: string | null
          special_instructions?: string | null
          status?: string
          updated_at?: string
          visit_date?: string
        }
        Update: {
          arrival_method?: string
          arrived_at?: string | null
          arrived_by?: string | null
          created_at?: string
          data?: Json
          departed_at?: string | null
          departed_by?: string | null
          departing_at?: string | null
          departing_by?: string | null
          departure_notes?: string | null
          event?: string | null
          expected_arrival?: string | null
          expected_departure?: string | null
          guest_id?: string
          host_name?: string | null
          host_phone?: string | null
          id?: string
          internal_notes?: string | null
          parked_at?: string | null
          parked_by?: string | null
          party_size?: number
          received_at?: string | null
          received_by?: string | null
          special_instructions?: string | null
          status?: string
          updated_at?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_visits_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "vip_guests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
