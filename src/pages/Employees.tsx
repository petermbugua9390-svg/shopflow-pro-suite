import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, ShieldCheck, Clock, ScrollText, Download, X, Plus, Trash2 } from "lucide-react";
import { formatKSh } from "@/lib/currency";
import { exportCsv } from "@/lib/exportCsv";
import {
  ALL_ROLES,
  AppRole,
  useAssignRole,
  useAuditLogs,
  useClaimFirstAdmin,
  useDeletePermission,
  useDeleteShift,
  useEndShift,
  useMyActiveShift,
  useMyRoles,
  usePermissions,
  useRemoveRole,
  useShifts,
  useStaff,
  useStartShift,
  useSystemLogs,
  useUpsertPermission,
} from "@/hooks/useStaff";

const RESOURCES = ["products", "inventory", "sales", "customers", "suppliers", "purchasing", "accounting", "reports", "branches", "settings"];

function Empty({ label }: { label: string }) {
  return <p className="text-sm text-muted-foreground py-8 text-center">{label}</p>;
}

export default function Employees() {
  const { data: myRoles = [] } = useMyRoles();
  const isAdmin = myRoles.includes("admin");
  const claimAdmin = useClaimFirstAdmin();

  const { data: staff = [], isLoading: staffLoading } = useStaff();
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();
  const [roleDraft, setRoleDraft] = useState<Record<string, AppRole>>({});

  const { data: shifts = [] } = useShifts();
  const { data: activeShift } = useMyActiveShift();
  const startShift = useStartShift();
  const endShift = useEndShift();
  const deleteShift = useDeleteShift();
  const [shiftOpen, setShiftOpen] = useState(false);
  const [cashAmount, setCashAmount] = useState("");

  const { data: auditLogs = [] } = useAuditLogs();
  const { data: systemLogs = [] } = useSystemLogs();

  const { data: permissions = [] } = usePermissions();
  const upsertPermission = useUpsertPermission();
  const deletePermission = useDeletePermission();
  const [permRole, setPermRole] = useState<AppRole>("cashier");
  const [permResource, setPermResource] = useState(RESOURCES[0]);

  const nameFor = useMemo(() => {
    const map = new Map(staff.map((s) => [s.user_id, s.full_name || s.email || s.user_id.slice(0, 8)]));
    return (id: string | null) => (id ? map.get(id) ?? id.slice(0, 8) : "—");
  }, [staff]);

  const activeShifts = shifts.filter((s) => s.status === "active").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Staff &amp; Security
          </h1>
          <p className="text-sm text-muted-foreground">Roles, permissions, shifts and audit trail</p>
        </div>
        {!isAdmin && (
          <Button variant="outline" onClick={() => claimAdmin.mutate()} disabled={claimAdmin.isPending}>
            <ShieldCheck className="h-4 w-4 mr-2" /> Claim admin access
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Team members", value: String(staff.length) },
          { label: "Active shifts", value: String(activeShifts) },
          { label: "Your roles", value: myRoles.length ? myRoles.join(", ") : "none" },
          { label: "Audit entries", value: String(auditLogs.length) },
        ].map((s) => (
          <Card key={s.label} className="glass-card border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-semibold capitalize truncate">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="staff" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="staff">Staff &amp; Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
          <TabsTrigger value="audit">Activity Log</TabsTrigger>
        </TabsList>

        {/* ---------------- Staff ---------------- */}
        <TabsContent value="staff">
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold">Team members</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  exportCsv(
                    staff.map((s) => ({ Name: s.full_name ?? "", Email: s.email ?? "", Roles: s.roles.join(" | "), Joined: new Date(s.created_at).toLocaleDateString() })),
                    "staff.csv"
                  )
                }
                disabled={!staff.length}
              >
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              {staffLoading ? (
                <Empty label="Loading…" />
              ) : staff.length === 0 ? (
                <Empty label="No team members yet." />
              ) : (
                <div className="space-y-3">
                  {staff.map((s) => (
                    <div key={s.user_id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-muted/20">
                      <div>
                        <p className="text-sm font-medium">{s.full_name || "Unnamed user"}</p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {s.roles.length === 0 && <span className="text-xs text-muted-foreground">No role</span>}
                        {s.roles.map((r) => (
                          <Badge key={r} variant="secondary" className="text-[10px] gap-1">
                            {r}
                            {isAdmin && (
                              <button onClick={() => removeRole.mutate({ userId: s.user_id, role: r })} aria-label={`Remove ${r}`}>
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </Badge>
                        ))}
                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <Select
                              value={roleDraft[s.user_id] ?? ""}
                              onValueChange={(v) => setRoleDraft((d) => ({ ...d, [s.user_id]: v as AppRole }))}
                            >
                              <SelectTrigger className="h-8 w-[130px] text-xs">
                                <SelectValue placeholder="Add role" />
                              </SelectTrigger>
                              <SelectContent>
                                {ALL_ROLES.filter((r) => !s.roles.includes(r)).map((r) => (
                                  <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              className="h-8"
                              disabled={!roleDraft[s.user_id]}
                              onClick={() => assignRole.mutate({ userId: s.user_id, role: roleDraft[s.user_id] })}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Permissions ---------------- */}
        <TabsContent value="permissions">
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Role permission matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAdmin && (
                <div className="flex flex-wrap items-end gap-2 p-3 rounded-lg bg-muted/20">
                  <div>
                    <Label className="text-xs">Role</Label>
                    <Select value={permRole} onValueChange={(v) => setPermRole(v as AppRole)}>
                      <SelectTrigger className="h-9 w-[150px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Resource</Label>
                    <Select value={permResource} onValueChange={setPermResource}>
                      <SelectTrigger className="h-9 w-[170px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {RESOURCES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() =>
                      upsertPermission.mutate({ role: permRole, resource: permResource, can_create: false, can_read: true, can_update: false, can_delete: false })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add rule
                  </Button>
                </div>
              )}

              {permissions.length === 0 ? (
                <Empty label="No permission rules defined." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead className="text-center">Create</TableHead>
                      <TableHead className="text-center">Read</TableHead>
                      <TableHead className="text-center">Update</TableHead>
                      <TableHead className="text-center">Delete</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="capitalize text-sm">{p.role}</TableCell>
                        <TableCell className="capitalize text-sm">{p.resource}</TableCell>
                        {(["can_create", "can_read", "can_update", "can_delete"] as const).map((k) => (
                          <TableCell key={k} className="text-center">
                            <Checkbox
                              checked={!!p[k]}
                              disabled={!isAdmin}
                              onCheckedChange={(v) =>
                                upsertPermission.mutate({
                                  id: p.id,
                                  role: p.role,
                                  resource: p.resource,
                                  can_create: !!p.can_create,
                                  can_read: !!p.can_read,
                                  can_update: !!p.can_update,
                                  can_delete: !!p.can_delete,
                                  [k]: v === true,
                                } as never)
                              }
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-right">
                          {isAdmin && (
                            <Button variant="ghost" size="icon" onClick={() => deletePermission.mutate(p.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Shifts ---------------- */}
        <TabsContent value="shifts">
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Shifts &amp; cash drawer
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { setCashAmount(""); setShiftOpen(true); }}>
                  {activeShift ? "Close shift" : "Start shift"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!shifts.length}
                  onClick={() =>
                    exportCsv(
                      shifts.map((s) => ({
                        Employee: nameFor(s.user_id),
                        Start: new Date(s.start_time).toLocaleString(),
                        End: s.end_time ? new Date(s.end_time).toLocaleString() : "",
                        Opening: s.opening_cash ?? 0,
                        Closing: s.closing_cash ?? 0,
                        Sales: s.total_sales ?? 0,
                        Status: s.status,
                      })),
                      "shifts.csv"
                    )
                  }
                >
                  <Download className="h-4 w-4 mr-2" /> Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {shifts.length === 0 ? (
                <Empty label="No shifts recorded yet." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead className="text-right">Opening</TableHead>
                      <TableHead className="text-right">Closing</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shifts.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-sm">{nameFor(s.user_id)}</TableCell>
                        <TableCell className="text-xs">{new Date(s.start_time).toLocaleString()}</TableCell>
                        <TableCell className="text-xs">{s.end_time ? new Date(s.end_time).toLocaleString() : "—"}</TableCell>
                        <TableCell className="text-right text-sm">{formatKSh(Number(s.opening_cash ?? 0))}</TableCell>
                        <TableCell className="text-right text-sm">{s.closing_cash == null ? "—" : formatKSh(Number(s.closing_cash))}</TableCell>
                        <TableCell>
                          <Badge variant={s.status === "active" ? "default" : "secondary"} className="text-[10px]">{s.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => deleteShift.mutate(s.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Audit ---------------- */}
        <TabsContent value="audit" className="space-y-4">
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-primary" /> Data changes
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                disabled={!auditLogs.length}
                onClick={() =>
                  exportCsv(
                    auditLogs.map((l) => ({ When: new Date(l.created_at).toLocaleString(), User: nameFor(l.user_id), Table: l.table_name, Action: l.action })),
                    "audit-log.csv"
                  )
                }
              >
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <Empty label="No audit entries. Admin access is required to view these." />
              ) : (
                <div className="space-y-2">
                  {auditLogs.map((l) => (
                    <div key={l.id} className="flex items-center justify-between p-2 rounded bg-muted/20 text-xs">
                      <span className="font-medium">{l.action} · {l.table_name}</span>
                      <span className="text-muted-foreground">{nameFor(l.user_id)} · {new Date(l.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">System activity</CardTitle>
            </CardHeader>
            <CardContent>
              {systemLogs.length === 0 ? (
                <Empty label="No system activity recorded." />
              ) : (
                <div className="space-y-2">
                  {systemLogs.map((l) => (
                    <div key={l.id} className="flex items-center justify-between p-2 rounded bg-muted/20 text-xs">
                      <span className="font-medium">{l.action}{l.resource ? ` · ${l.resource}` : ""}</span>
                      <span className="text-muted-foreground">{nameFor(l.user_id)} · {new Date(l.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={shiftOpen} onOpenChange={setShiftOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeShift ? "Close shift" : "Start shift"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{activeShift ? "Closing cash (KSh)" : "Opening cash float (KSh)"}</Label>
            <Input type="number" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} placeholder="0.00" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShiftOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                const amount = Number(cashAmount) || 0;
                if (activeShift) endShift.mutate({ shiftId: activeShift.id, closingCash: amount });
                else startShift.mutate({ openingCash: amount });
                setShiftOpen(false);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
