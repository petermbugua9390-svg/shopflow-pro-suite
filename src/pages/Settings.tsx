import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { HardwareTab } from "@/components/HardwareTab";
import { BackupTab } from "@/components/BackupTab";
import { Settings as SettingsIcon, User, Shield, Monitor, Bell, Globe } from "lucide-react";

export default function Settings() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-primary" /> Settings
        </h1>
        <p className="text-sm text-muted-foreground">System configuration and preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="hardware">Hardware</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Monitor className="h-4 w-4 text-primary" />Store Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Store Name", value: "My Store" },
                  { label: "Business ID", value: "—" },
                  { label: "Currency", value: "Kenyan Shilling (KSh)" },
                  { label: "Tax Rate", value: "16% VAT" },
                  { label: "Time Zone", value: "Africa/Nairobi (EAT)" },
                  { label: "Language", value: "English" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">POS Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Auto-print receipt", default: true },
                  { label: "Play sound on scan", default: true },
                  { label: "Show product images in POS", default: false },
                  { label: "Enable offline mode", default: true },
                  { label: "Auto-sync on reconnect", default: true },
                  { label: "Require cashier login per sale", default: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <Label className="text-sm">{item.label}</Label>
                    <Switch defaultChecked={item.default} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><User className="h-4 w-4 text-primary" />Users & Access Control</CardTitle>
                <Button size="sm">Add User</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "Sarah Kim", role: "Store Manager", email: "s.kim@retailpro.com", status: "active", permissions: "Full Access" },
                { name: "Mike Rivers", role: "Cashier", email: "m.rivers@retailpro.com", status: "active", permissions: "POS, Inventory View" },
                { name: "Lisa Martinez", role: "Cashier", email: "l.martinez@retailpro.com", status: "active", permissions: "POS Only" },
                { name: "David Park", role: "Branch Manager", email: "d.park@retailpro.com", status: "active", permissions: "Branch Management" },
                { name: "Admin User", role: "Administrator", email: "admin@retailpro.com", status: "active", permissions: "Full System Access" },
              ].map((user) => (
                <div key={user.email} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">{user.name.split(" ").map((n) => n[0]).join("")}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-[10px]">{user.role}</Badge>
                    <Badge variant="outline" className="text-[10px]">{user.permissions}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hardware">
          <HardwareTab />
        </TabsContent>

        <TabsContent value="integrations">
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Globe className="h-4 w-4 text-primary" />Integrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "M-Pesa Mobile Payments", category: "Payments", status: "active" },
                { name: "Stripe Payment Gateway", category: "Payments", status: "active" },
                { name: "Twilio SMS Gateway", category: "Communications", status: "active" },
                { name: "SendGrid Email", category: "Communications", status: "active" },
                { name: "QuickBooks Online", category: "Accounting", status: "pending" },
                { name: "Shopify eCommerce", category: "eCommerce", status: "inactive" },
                { name: "WooCommerce", category: "eCommerce", status: "inactive" },
                { name: "Xero Accounting", category: "Accounting", status: "inactive" },
              ].map((integration) => (
                <div key={integration.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <div>
                    <p className="text-sm font-medium">{integration.name}</p>
                    <p className="text-xs text-muted-foreground">{integration.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] ${
                      integration.status === "active" ? "bg-success text-success-foreground" :
                      integration.status === "pending" ? "bg-warning text-warning-foreground" :
                      "bg-muted text-muted-foreground"
                    }`}>{integration.status}</Badge>
                    <Button variant="outline" size="sm" className="text-xs h-7">Configure</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Bell className="h-4 w-4 text-primary" />Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Low stock alerts", desc: "Notify when product falls below reorder level", default: true },
                { label: "Daily sales summary", desc: "Email end-of-day sales report", default: true },
                { label: "New customer registration", desc: "Alert on new loyalty sign-ups", default: false },
                { label: "Large transaction alerts", desc: "Notify for transactions above $500", default: true },
                { label: "Refund notifications", desc: "Alert managers on all refund processing", default: true },
                { label: "System maintenance alerts", desc: "Scheduled downtime notifications", default: true },
                { label: "AI insight alerts", desc: "Push AI-generated business insights", default: true },
              ].map((notif) => (
                <div key={notif.label} className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">{notif.label}</Label>
                    <p className="text-xs text-muted-foreground">{notif.desc}</p>
                  </div>
                  <Switch defaultChecked={notif.default} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Two-factor authentication", desc: "Require 2FA for all admin accounts", default: true },
                { label: "Session timeout", desc: "Auto-logout after 30 minutes of inactivity", default: true },
                { label: "IP whitelisting", desc: "Restrict admin access to specific IPs", default: false },
                { label: "Audit logging", desc: "Log all system changes and user actions", default: true },
                { label: "Fraud detection", desc: "AI-powered suspicious activity monitoring", default: true },
                { label: "Database encryption", desc: "Encrypt sensitive data at rest", default: true },
                { label: "Automatic backups", desc: "Daily encrypted cloud backups", default: true },
              ].map((setting) => (
                <div key={setting.label} className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">{setting.label}</Label>
                    <p className="text-xs text-muted-foreground">{setting.desc}</p>
                  </div>
                  <Switch defaultChecked={setting.default} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="backup">
          <BackupTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
