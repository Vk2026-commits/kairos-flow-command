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
      audit_log: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          details: Json
          id: string
          new_status: string | null
          organization_id: string | null
          previous_status: string | null
          record_id: string | null
          record_label: string | null
          record_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          details?: Json
          id?: string
          new_status?: string | null
          organization_id?: string | null
          previous_status?: string | null
          record_id?: string | null
          record_label?: string | null
          record_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          details?: Json
          id?: string
          new_status?: string | null
          organization_id?: string | null
          previous_status?: string | null
          record_id?: string | null
          record_label?: string | null
          record_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      consulting_action_items: {
        Row: {
          created_at: string
          data: Json
          id: string
          occurred_on: string | null
          organization_id: string
          owner_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          organization_id?: string
          owner_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          organization_id?: string
          owner_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consulting_action_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      consulting_activities: {
        Row: {
          created_at: string
          data: Json
          id: string
          occurred_on: string | null
          organization_id: string
          owner_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          organization_id?: string
          owner_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          organization_id?: string
          owner_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consulting_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      consulting_before_after: {
        Row: {
          created_at: string
          data: Json
          id: string
          occurred_on: string | null
          organization_id: string
          owner_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          organization_id?: string
          owner_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          organization_id?: string
          owner_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consulting_before_after_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      consulting_briefings: {
        Row: {
          created_at: string
          data: Json
          id: string
          occurred_on: string | null
          organization_id: string
          owner_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          organization_id?: string
          owner_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          organization_id?: string
          owner_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consulting_briefings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      consulting_checklist: {
        Row: {
          created_at: string
          data: Json
          id: string
          occurred_on: string | null
          organization_id: string
          owner_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          organization_id?: string
          owner_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          organization_id?: string
          owner_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consulting_checklist_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      consulting_decisions: {
        Row: {
          created_at: string
          data: Json
          id: string
          occurred_on: string | null
          organization_id: string
          owner_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          organization_id?: string
          owner_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          organization_id?: string
          owner_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consulting_decisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      consulting_milestones: {
        Row: {
          created_at: string
          data: Json
          id: string
          occurred_on: string | null
          organization_id: string
          owner_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          organization_id?: string
          owner_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          organization_id?: string
          owner_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consulting_milestones_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      consulting_notes: {
        Row: {
          created_at: string
          data: Json
          id: string
          occurred_on: string | null
          organization_id: string
          owner_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          organization_id?: string
          owner_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          organization_id?: string
          owner_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consulting_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      consulting_parking_counts: {
        Row: {
          created_at: string
          data: Json
          id: string
          occurred_on: string | null
          organization_id: string
          owner_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          organization_id?: string
          owner_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          organization_id?: string
          owner_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consulting_parking_counts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      consulting_project: {
        Row: {
          created_at: string
          data: Json
          id: string
          next_action: string | null
          organization_id: string
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
          organization_id?: string
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
          organization_id?: string
          phase?: string
          progress_pct?: number
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consulting_project_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      consulting_recommendations: {
        Row: {
          created_at: string
          data: Json
          id: string
          occurred_on: string | null
          organization_id: string
          owner_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          organization_id?: string
          owner_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          organization_id?: string
          owner_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consulting_recommendations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      consulting_site_visits: {
        Row: {
          created_at: string
          data: Json
          id: string
          occurred_on: string | null
          organization_id: string
          owner_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          organization_id?: string
          owner_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          occurred_on?: string | null
          organization_id?: string
          owner_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consulting_site_visits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      device_access_codes: {
        Row: {
          code: string
          created_at: string
          label: string | null
          last_used_at: string | null
          organization_id: string
          revoked: boolean
          role: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          label?: string | null
          last_used_at?: string | null
          organization_id?: string
          revoked?: boolean
          role?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          label?: string | null
          last_used_at?: string | null
          organization_id?: string
          revoked?: boolean
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_access_codes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content_type: string | null
          created_at: string
          description: string | null
          file_size: number | null
          id: string
          meta: string | null
          organization_id: string
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
          organization_id?: string
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
          organization_id?: string
          storage_path?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      kairos_state: {
        Row: {
          data: Json
          key: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          data?: Json
          key: string
          organization_id?: string
          updated_at?: string
        }
        Update: {
          data?: Json
          key?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kairos_state_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          invitation_status: string
          invited_at: string | null
          last_login_at: string | null
          member_role: string
          organization_id: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          invitation_status?: string
          invited_at?: string | null
          last_login_at?: string | null
          member_role?: string
          organization_id: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          invitation_status?: string
          invited_at?: string | null
          last_login_at?: string | null
          member_role?: string
          organization_id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          account_status: string
          address: string | null
          city: string | null
          client_type: string
          contact_title: string | null
          contract_end: string | null
          contract_start: string | null
          created_at: string
          data: Json
          email: string | null
          id: string
          internal_notes: string | null
          logo_path: string | null
          modules: Json
          name: string
          phone: string | null
          primary_contact: string | null
          project_name: string | null
          slug: string | null
          state: string | null
          updated_at: string
          website: string | null
          zip: string | null
        }
        Insert: {
          account_status?: string
          address?: string | null
          city?: string | null
          client_type?: string
          contact_title?: string | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          data?: Json
          email?: string | null
          id?: string
          internal_notes?: string | null
          logo_path?: string | null
          modules?: Json
          name: string
          phone?: string | null
          primary_contact?: string | null
          project_name?: string | null
          slug?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Update: {
          account_status?: string
          address?: string | null
          city?: string | null
          client_type?: string
          contact_title?: string | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          data?: Json
          email?: string | null
          id?: string
          internal_notes?: string | null
          logo_path?: string | null
          modules?: Json
          name?: string
          phone?: string | null
          primary_contact?: string | null
          project_name?: string | null
          slug?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_org_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          active_org_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          active_org_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_org_id_fkey"
            columns: ["active_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string
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
          organization_id?: string
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
          organization_id?: string
          saved_at?: number
          service?: string | null
          street_view?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "traffic_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
          organization_id: string
          visit_id: string | null
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          details?: string | null
          guest_name?: string | null
          id?: string
          organization_id?: string
          visit_id?: string | null
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          details?: string | null
          guest_name?: string | null
          id?: string
          organization_id?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vip_activity_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
          organization_id: string
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
          organization_id?: string
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
          organization_id?: string
          phone?: string | null
          photo_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_guests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_notes: {
        Row: {
          actor: string | null
          category: string | null
          created_at: string
          id: string
          note: string
          organization_id: string
          visit_id: string
        }
        Insert: {
          actor?: string | null
          category?: string | null
          created_at?: string
          id?: string
          note?: string
          organization_id?: string
          visit_id: string
        }
        Update: {
          actor?: string | null
          category?: string | null
          created_at?: string
          id?: string
          note?: string
          organization_id?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
          organization_id: string
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
          organization_id?: string
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
          organization_id?: string
          reserved_area?: string | null
          space_zone?: string | null
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_parking_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
          organization_id: string
          status: string
          visit_id: string
        }
        Insert: {
          actor?: string | null
          created_at?: string
          id?: string
          note?: string | null
          organization_id?: string
          status: string
          visit_id: string
        }
        Update: {
          actor?: string | null
          created_at?: string
          id?: string
          note?: string | null
          organization_id?: string
          status?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_status_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
          organization_id: string
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
          organization_id?: string
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
          organization_id?: string
          plate?: string | null
          updated_at?: string
          vehicle_type?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_vehicles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
          organization_id: string
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
          organization_id?: string
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
          organization_id?: string
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
          {
            foreignKeyName: "vip_visits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_kairos_super_admin: { Args: { _user_id: string }; Returns: boolean }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "contributor" | "viewer"
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
    Enums: {
      app_role: ["admin", "contributor", "viewer"],
    },
  },
} as const
