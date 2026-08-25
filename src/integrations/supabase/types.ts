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
      ai_analytics: {
        Row: {
          confidence: number | null
          created_at: string
          data: Json | null
          description: string | null
          id: string
          is_dismissed: boolean | null
          title: string
          type: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          data?: Json | null
          description?: string | null
          id?: string
          is_dismissed?: boolean | null
          title: string
          type: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          data?: Json | null
          description?: string | null
          id?: string
          is_dismissed?: boolean | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      analytics_data: {
        Row: {
          average_order_value: number | null
          branch_id: string | null
          created_at: string
          date: string
          id: string
          payment_breakdown: Json | null
          top_products: Json | null
          total_items_sold: number | null
          total_revenue: number | null
          total_transactions: number | null
        }
        Insert: {
          average_order_value?: number | null
          branch_id?: string | null
          created_at?: string
          date: string
          id?: string
          payment_breakdown?: Json | null
          top_products?: Json | null
          total_items_sold?: number | null
          total_revenue?: number | null
          total_transactions?: number | null
        }
        Update: {
          average_order_value?: number | null
          branch_id?: string | null
          created_at?: string
          date?: string
          id?: string
          payment_breakdown?: Json | null
          top_products?: Json | null
          total_items_sold?: number | null
          total_revenue?: number | null
          total_transactions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_data_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      branch_employees: {
        Row: {
          branch_id: string
          hired_at: string
          id: string
          is_active: boolean | null
          position: string | null
          user_id: string
        }
        Insert: {
          branch_id: string
          hired_at?: string
          id?: string
          is_active?: boolean | null
          position?: string | null
          user_id: string
        }
        Update: {
          branch_id?: string
          hired_at?: string
          id?: string
          is_active?: boolean | null
          position?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          created_at: string
          daily_revenue: number | null
          employee_count: number | null
          id: string
          manager_id: string | null
          monthly_target: number | null
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["branch_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          daily_revenue?: number | null
          employee_count?: number | null
          id?: string
          manager_id?: string | null
          monthly_target?: number | null
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["branch_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          daily_revenue?: number | null
          employee_count?: number | null
          id?: string
          manager_id?: string | null
          monthly_target?: number | null
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["branch_status"]
          updated_at?: string
        }
        Relationships: []
      }
      chart_of_accounts: {
        Row: {
          account_code: string
          balance: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          type: Database["public"]["Enums"]["account_type"]
        }
        Insert: {
          account_code: string
          balance?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          type: Database["public"]["Enums"]["account_type"]
        }
        Update: {
          account_code?: string
          balance?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          type?: Database["public"]["Enums"]["account_type"]
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_purchase: number | null
          type: Database["public"]["Enums"]["coupon_type"]
          used_count: number | null
          valid_from: string
          valid_until: string | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_purchase?: number | null
          type: Database["public"]["Enums"]["coupon_type"]
          used_count?: number | null
          valid_from?: string
          valid_until?: string | null
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_purchase?: number | null
          type?: Database["public"]["Enums"]["coupon_type"]
          used_count?: number | null
          valid_from?: string
          valid_until?: string | null
          value?: number
        }
        Relationships: []
      }
      customer_credit: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          customer_id: string
          description: string | null
          id: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          customer_id: string
          description?: string | null
          id?: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string
          description?: string | null
          id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_credit_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_loyalty: {
        Row: {
          created_at: string
          customer_id: string
          description: string | null
          id: string
          points_earned: number
          points_redeemed: number
          transaction_ref: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          points_earned?: number
          points_redeemed?: number
          transaction_ref?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          points_earned?: number
          points_redeemed?: number
          transaction_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_loyalty_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          credit_balance: number | null
          date_of_birth: string | null
          email: string | null
          id: string
          is_active: boolean | null
          loyalty_points: number | null
          name: string
          notes: string | null
          phone: string | null
          tier: Database["public"]["Enums"]["customer_tier"] | null
          total_spent: number | null
          updated_at: string
          visits: number | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          credit_balance?: number | null
          date_of_birth?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          loyalty_points?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          tier?: Database["public"]["Enums"]["customer_tier"] | null
          total_spent?: number | null
          updated_at?: string
          visits?: number | null
        }
        Update: {
          address?: string | null
          created_at?: string
          credit_balance?: number | null
          date_of_birth?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          loyalty_points?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          tier?: Database["public"]["Enums"]["customer_tier"] | null
          total_spent?: number | null
          updated_at?: string
          visits?: number | null
        }
        Relationships: []
      }
      employee_performance: {
        Row: {
          average_transaction: number | null
          created_at: string
          id: string
          items_sold: number | null
          notes: string | null
          period_end: string
          period_start: string
          rating: number | null
          total_sales: number | null
          total_transactions: number | null
          user_id: string
        }
        Insert: {
          average_transaction?: number | null
          created_at?: string
          id?: string
          items_sold?: number | null
          notes?: string | null
          period_end: string
          period_start: string
          rating?: number | null
          total_sales?: number | null
          total_transactions?: number | null
          user_id: string
        }
        Update: {
          average_transaction?: number | null
          created_at?: string
          id?: string
          items_sold?: number | null
          notes?: string | null
          period_end?: string
          period_start?: string
          rating?: number | null
          total_sales?: number | null
          total_transactions?: number | null
          user_id?: string
        }
        Relationships: []
      }
      employee_shifts: {
        Row: {
          branch_id: string | null
          closing_cash: number | null
          end_time: string | null
          id: string
          notes: string | null
          opening_cash: number | null
          start_time: string
          status: Database["public"]["Enums"]["shift_status"]
          total_sales: number | null
          total_transactions: number | null
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          closing_cash?: number | null
          end_time?: string | null
          id?: string
          notes?: string | null
          opening_cash?: number | null
          start_time?: string
          status?: Database["public"]["Enums"]["shift_status"]
          total_sales?: number | null
          total_transactions?: number | null
          user_id: string
        }
        Update: {
          branch_id?: string | null
          closing_cash?: number | null
          end_time?: string | null
          id?: string
          notes?: string | null
          opening_cash?: number | null
          start_time?: string
          status?: Database["public"]["Enums"]["shift_status"]
          total_sales?: number | null
          total_transactions?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_shifts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_by: string | null
          branch_id: string | null
          category_id: string | null
          created_at: string
          description: string
          expense_date: string
          id: string
          receipt_url: string | null
          status: Database["public"]["Enums"]["expense_status"]
          submitted_by: string
          updated_at: string
        }
        Insert: {
          amount: number
          approved_by?: string | null
          branch_id?: string | null
          category_id?: string | null
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          submitted_by: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          branch_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          submitted_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      forecast_data: {
        Row: {
          actual_value: number | null
          branch_id: string | null
          created_at: string
          forecast_value: number | null
          id: string
          metric: string
          period: string
        }
        Insert: {
          actual_value?: number | null
          branch_id?: string | null
          created_at?: string
          forecast_value?: number | null
          id?: string
          metric: string
          period: string
        }
        Update: {
          actual_value?: number | null
          branch_id?: string | null
          created_at?: string
          forecast_value?: number | null
          id?: string
          metric?: string
          period?: string
        }
        Relationships: [
          {
            foreignKeyName: "forecast_data_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          code: string
          created_at: string
          current_balance: number
          customer_id: string | null
          expires_at: string | null
          id: string
          initial_balance: number
          is_active: boolean | null
        }
        Insert: {
          code: string
          created_at?: string
          current_balance: number
          customer_id?: string | null
          expires_at?: string | null
          id?: string
          initial_balance: number
          is_active?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string
          current_balance?: number
          customer_id?: string | null
          expires_at?: string | null
          id?: string
          initial_balance?: number
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_cards_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          batch_number: string | null
          branch_id: string | null
          expiry_date: string | null
          id: string
          location_id: string | null
          product_id: string
          quantity: number
          reserved_quantity: number | null
          updated_at: string
        }
        Insert: {
          batch_number?: string | null
          branch_id?: string | null
          expiry_date?: string | null
          id?: string
          location_id?: string | null
          product_id: string
          quantity?: number
          reserved_quantity?: number | null
          updated_at?: string
        }
        Update: {
          batch_number?: string | null
          branch_id?: string | null
          expiry_date?: string | null
          id?: string
          location_id?: string | null
          product_id?: string
          quantity?: number
          reserved_quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "inventory_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_adjustments: {
        Row: {
          adjusted_by: string
          adjustment_type: string
          branch_id: string | null
          created_at: string
          id: string
          product_id: string
          quantity_change: number
          reason: string | null
        }
        Insert: {
          adjusted_by: string
          adjustment_type: string
          branch_id?: string | null
          created_at?: string
          id?: string
          product_id: string
          quantity_change: number
          reason?: string | null
        }
        Update: {
          adjusted_by?: string
          adjustment_type?: string
          branch_id?: string | null
          created_at?: string
          id?: string
          product_id?: string
          quantity_change?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_adjustments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_locations: {
        Row: {
          branch_id: string | null
          capacity: number | null
          created_at: string
          id: string
          name: string
          type: string | null
        }
        Insert: {
          branch_id?: string | null
          capacity?: number | null
          created_at?: string
          id?: string
          name: string
          type?: string | null
        }
        Update: {
          branch_id?: string | null
          capacity?: number | null
          created_at?: string
          id?: string
          name?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_locations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transfer_items: {
        Row: {
          id: string
          product_id: string
          quantity: number
          received_quantity: number | null
          transfer_id: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity: number
          received_quantity?: number | null
          transfer_id: string
        }
        Update: {
          id?: string
          product_id?: string
          quantity?: number
          received_quantity?: number | null
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transfer_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfer_items_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "inventory_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transfers: {
        Row: {
          completed_at: string | null
          created_at: string
          from_branch_id: string | null
          id: string
          initiated_by: string
          notes: string | null
          status: Database["public"]["Enums"]["transfer_status"]
          to_branch_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          from_branch_id?: string | null
          id?: string
          initiated_by: string
          notes?: string | null
          status?: Database["public"]["Enums"]["transfer_status"]
          to_branch_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          from_branch_id?: string | null
          id?: string
          initiated_by?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["transfer_status"]
          to_branch_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transfers_from_branch_id_fkey"
            columns: ["from_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfers_to_branch_id_fkey"
            columns: ["to_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string
          created_by: string
          description: string
          entry_number: string | null
          id: string
          is_posted: boolean | null
          posted_at: string
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          entry_number?: string | null
          id?: string
          is_posted?: boolean | null
          posted_at?: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          entry_number?: string | null
          id?: string
          is_posted?: boolean | null
          posted_at?: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: []
      }
      journal_entry_lines: {
        Row: {
          account_id: string
          amount: number
          description: string | null
          id: string
          journal_entry_id: string
          type: Database["public"]["Enums"]["journal_entry_type"]
        }
        Insert: {
          account_id: string
          amount: number
          description?: string | null
          id?: string
          journal_entry_id: string
          type: Database["public"]["Enums"]["journal_entry_type"]
        }
        Update: {
          account_id?: string
          amount?: number
          description?: string | null
          id?: string
          journal_entry_id?: string
          type?: Database["public"]["Enums"]["journal_entry_type"]
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          type: Database["public"]["Enums"]["payment_type"]
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          type: Database["public"]["Enums"]["payment_type"]
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          type?: Database["public"]["Enums"]["payment_type"]
        }
        Relationships: []
      }
      permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_read: boolean | null
          can_update: boolean | null
          created_at: string
          id: string
          resource: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          created_at?: string
          id?: string
          resource: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          created_at?: string
          id?: string
          resource?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      product_barcodes: {
        Row: {
          barcode: string
          barcode_type: string | null
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          barcode: string
          barcode_type?: string | null
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          barcode?: string
          barcode_type?: string | null
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_barcodes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          is_primary: boolean | null
          product_id: string
          sort_order: number | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          product_id: string
          sort_order?: number | null
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          product_id?: string
          sort_order?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variations: {
        Row: {
          attributes: Json | null
          barcode: string | null
          created_at: string
          id: string
          name: string
          price_modifier: number | null
          product_id: string
          sku: string | null
          stock_quantity: number | null
        }
        Insert: {
          attributes?: Json | null
          barcode?: string | null
          created_at?: string
          id?: string
          name: string
          price_modifier?: number | null
          product_id: string
          sku?: string | null
          stock_quantity?: number | null
        }
        Update: {
          attributes?: Json | null
          barcode?: string | null
          created_at?: string
          id?: string
          name?: string
          price_modifier?: number | null
          product_id?: string
          sku?: string | null
          stock_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          category_id: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_taxable: boolean | null
          name: string
          price: number
          reorder_level: number | null
          sku: string | null
          stock_quantity: number
          tags: string[] | null
          tax_rate: number | null
          unit: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_taxable?: boolean | null
          name: string
          price?: number
          reorder_level?: number | null
          sku?: string | null
          stock_quantity?: number
          tags?: string[] | null
          tax_rate?: number | null
          unit?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_taxable?: boolean | null
          name?: string
          price?: number
          reorder_level?: number | null
          sku?: string | null
          stock_quantity?: number
          tags?: string[] | null
          tax_rate?: number | null
          unit?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_deliveries: {
        Row: {
          created_at: string
          delivery_date: string
          id: string
          notes: string | null
          purchase_order_id: string
          received_by: string
        }
        Insert: {
          created_at?: string
          delivery_date?: string
          id?: string
          notes?: string | null
          purchase_order_id: string
          received_by: string
        }
        Update: {
          created_at?: string
          delivery_date?: string
          id?: string
          notes?: string | null
          purchase_order_id?: string
          received_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_deliveries_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          id: string
          product_id: string
          purchase_order_id: string
          quantity: number
          received_quantity: number | null
          total: number
          unit_cost: number
        }
        Insert: {
          id?: string
          product_id: string
          purchase_order_id: string
          quantity: number
          received_quantity?: number | null
          total: number
          unit_cost: number
        }
        Update: {
          id?: string
          product_id?: string
          purchase_order_id?: string
          quantity?: number
          received_quantity?: number | null
          total?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          branch_id: string | null
          created_at: string
          expected_delivery: string | null
          id: string
          notes: string | null
          order_number: string | null
          ordered_by: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number | null
          supplier_id: string
          tax_amount: number | null
          total: number | null
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          order_number?: string | null
          ordered_by: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number | null
          supplier_id: string
          tax_amount?: number | null
          total?: number | null
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          order_number?: string | null
          ordered_by?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number | null
          supplier_id?: string
          tax_amount?: number | null
          total?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_discounts: {
        Row: {
          amount: number
          coupon_id: string | null
          description: string | null
          discount_type: string
          id: string
          sale_id: string
        }
        Insert: {
          amount: number
          coupon_id?: string | null
          description?: string | null
          discount_type: string
          id?: string
          sale_id: string
        }
        Update: {
          amount?: number
          coupon_id?: string | null
          description?: string | null
          discount_type?: string
          id?: string
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_discounts_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          discount: number | null
          id: string
          product_id: string
          quantity: number
          sale_id: string
          tax: number | null
          total: number
          unit_price: number
        }
        Insert: {
          discount?: number | null
          id?: string
          product_id: string
          quantity: number
          sale_id: string
          tax?: number | null
          total: number
          unit_price: number
        }
        Update: {
          discount?: number | null
          id?: string
          product_id?: string
          quantity?: number
          sale_id?: string
          tax?: number | null
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_type"]
          reference_number: string | null
          sale_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_method: Database["public"]["Enums"]["payment_type"]
          reference_number?: string | null
          sale_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_type"]
          reference_number?: string | null
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_returns: {
        Row: {
          created_at: string
          id: string
          processed_by: string
          product_id: string
          quantity: number
          reason: string | null
          refund_amount: number
          sale_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          processed_by: string
          product_id: string
          quantity: number
          reason?: string | null
          refund_amount: number
          sale_id: string
        }
        Update: {
          created_at?: string
          id?: string
          processed_by?: string
          product_id?: string
          quantity?: number
          reason?: string | null
          refund_amount?: number
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_returns_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_returns_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          branch_id: string | null
          cashier_id: string
          created_at: string
          customer_id: string | null
          discount_amount: number | null
          id: string
          notes: string | null
          sale_number: string | null
          status: Database["public"]["Enums"]["sale_status"]
          subtotal: number
          tax_amount: number | null
          total: number
        }
        Insert: {
          branch_id?: string | null
          cashier_id: string
          created_at?: string
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          sale_number?: string | null
          status?: Database["public"]["Enums"]["sale_status"]
          subtotal?: number
          tax_amount?: number | null
          total?: number
        }
        Update: {
          branch_id?: string | null
          cashier_id?: string
          created_at?: string
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          sale_number?: string | null
          status?: Database["public"]["Enums"]["sale_status"]
          subtotal?: number
          tax_amount?: number | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_payments: {
        Row: {
          amount: number
          id: string
          notes: string | null
          paid_at: string
          paid_by: string | null
          payment_method: string | null
          purchase_order_id: string | null
          reference_number: string | null
          supplier_id: string
        }
        Insert: {
          amount: number
          id?: string
          notes?: string | null
          paid_at?: string
          paid_by?: string | null
          payment_method?: string | null
          purchase_order_id?: string | null
          reference_number?: string | null
          supplier_id: string
        }
        Update: {
          amount?: number
          id?: string
          notes?: string | null
          paid_at?: string
          paid_by?: string | null
          payment_method?: string | null
          purchase_order_id?: string | null
          reference_number?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payments_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_products: {
        Row: {
          cost_price: number | null
          id: string
          is_preferred: boolean | null
          lead_time_days: number | null
          min_order_quantity: number | null
          product_id: string
          supplier_id: string
          supplier_sku: string | null
        }
        Insert: {
          cost_price?: number | null
          id?: string
          is_preferred?: boolean | null
          lead_time_days?: number | null
          min_order_quantity?: number | null
          product_id: string
          supplier_id: string
          supplier_sku?: string | null
        }
        Update: {
          cost_price?: number | null
          id?: string
          is_preferred?: boolean | null
          lead_time_days?: number | null
          min_order_quantity?: number | null
          product_id?: string
          supplier_id?: string
          supplier_sku?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          category: string | null
          company: string
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          notes: string | null
          outstanding_balance: number | null
          payment_terms: string | null
          phone: string | null
          rating: number | null
          status: Database["public"]["Enums"]["supplier_status"] | null
          total_orders: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          category?: string | null
          company: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          outstanding_balance?: number | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["supplier_status"] | null
          total_orders?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          category?: string | null
          company?: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          outstanding_balance?: number | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["supplier_status"] | null
          total_orders?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource: string | null
          resource_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource?: string | null
          resource_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource?: string | null
          resource_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tax_rates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          rate: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          rate: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          rate?: number
        }
        Relationships: []
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_sessions: {
        Row: {
          branch_id: string | null
          id: string
          ip_address: string | null
          login_at: string
          logout_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          id?: string
          ip_address?: string | null
          login_at?: string
          logout_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          branch_id?: string | null
          id?: string
          ip_address?: string | null
          login_at?: string
          logout_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_first_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_staff: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          roles: string[]
          user_id: string
        }[]
      }
    }
    Enums: {
      account_type: "asset" | "liability" | "equity" | "revenue" | "expense"
      app_role: "admin" | "manager" | "cashier" | "warehouse" | "accountant"
      branch_status: "open" | "closed" | "maintenance"
      coupon_type: "percentage" | "fixed_amount" | "buy_x_get_y"
      customer_tier: "Bronze" | "Silver" | "Gold" | "Platinum"
      expense_status: "pending" | "approved" | "rejected"
      journal_entry_type: "debit" | "credit"
      notification_type: "info" | "warning" | "error" | "success"
      order_status:
        | "pending"
        | "confirmed"
        | "shipped"
        | "delivered"
        | "cancelled"
      payment_type:
        | "cash"
        | "card"
        | "mobile"
        | "gift_card"
        | "credit"
        | "split"
      sale_status: "completed" | "refunded" | "pending" | "voided"
      shift_status: "active" | "completed" | "abandoned"
      supplier_status: "active" | "inactive" | "pending"
      transfer_status: "pending" | "in_transit" | "completed" | "cancelled"
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
      account_type: ["asset", "liability", "equity", "revenue", "expense"],
      app_role: ["admin", "manager", "cashier", "warehouse", "accountant"],
      branch_status: ["open", "closed", "maintenance"],
      coupon_type: ["percentage", "fixed_amount", "buy_x_get_y"],
      customer_tier: ["Bronze", "Silver", "Gold", "Platinum"],
      expense_status: ["pending", "approved", "rejected"],
      journal_entry_type: ["debit", "credit"],
      notification_type: ["info", "warning", "error", "success"],
      order_status: [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
      ],
      payment_type: ["cash", "card", "mobile", "gift_card", "credit", "split"],
      sale_status: ["completed", "refunded", "pending", "voided"],
      shift_status: ["active", "completed", "abandoned"],
      supplier_status: ["active", "inactive", "pending"],
      transfer_status: ["pending", "in_transit", "completed", "cancelled"],
    },
  },
} as const
