"use client";

import { useActionState, useState } from "react";
import { createTask, deleteTask, setTaskStatus } from "@/app/actions/tasks";
import type { Profile, Task } from "@/lib/supabase/types";

export function TaskBoard({
  tasks,
  people,
  currentUserId,
  canManage,
}: {
  tasks: Task[];
  people: Profile[];
  currentUserId: string;
  canManage: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const nameById = new Map(people.map((p) => [p.id, p.full_name ?? p.email ?? "Sin nombre"]));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted">Quehaceres</h2>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-surface"
          >
            {showForm ? "Cancelar" : "+ Nueva tarea"}
          </button>
        )}
      </div>

      {showForm && canManage && (
        <NewTaskForm people={people} onDone={() => setShowForm(false)} />
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-background text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Tarea</th>
              <th className="px-4 py-2 font-medium">Asignada a</th>
              <th className="px-4 py-2 font-medium">Vence</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const canToggle = canManage || task.assigned_to === currentUserId;
              return (
                <tr key={task.id} className="border-t border-border">
                  <td className="px-4 py-2">
                    <div className="font-medium">{task.title}</div>
                    {task.notes && <div className="text-xs text-muted">{task.notes}</div>}
                  </td>
                  <td className="px-4 py-2 text-muted">
                    {task.assigned_to ? nameById.get(task.assigned_to) ?? "—" : "—"}
                  </td>
                  <td className="px-4 py-2 text-muted">
                    {task.due_date
                      ? new Date(task.due_date + "T00:00:00").toLocaleDateString("es-AR")
                      : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        task.status === "hecha"
                          ? "bg-accent/15 text-accent"
                          : "bg-foreground/10 text-foreground"
                      }`}
                    >
                      {task.status === "hecha" ? "Hecha" : "Pendiente"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-3">
                      {canToggle && (
                        <button
                          type="button"
                          onClick={() =>
                            setTaskStatus(
                              task.id,
                              task.status === "hecha" ? "pendiente" : "hecha"
                            )
                          }
                          className="text-xs font-medium text-foreground hover:text-accent"
                        >
                          {task.status === "hecha" ? "Marcar pendiente" : "Marcar hecha"}
                        </button>
                      )}
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => deleteTask(task.id)}
                          className="text-xs font-medium text-danger hover:underline"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!tasks.length && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  No hay tareas cargadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewTaskForm({ people, onDone }: { people: Profile[]; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(async (prev: unknown, formData: FormData) => {
    const result = await createTask(prev, formData);
    if (!result?.error) onDone();
    return result;
  }, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className="text-sm font-medium">
            Tarea
          </label>
          <input
            id="title"
            name="title"
            required
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="assigned_to" className="text-sm font-medium">
            Asignada a
          </label>
          <select
            id="assigned_to"
            name="assigned_to"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">Sin asignar</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name ?? p.email ?? "Sin nombre"}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="due_date" className="text-sm font-medium">
            Vence (opcional)
          </label>
          <input
            id="due_date"
            name="due_date"
            type="date"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium">
          Notas (opcional)
        </label>
        <input
          id="notes"
          name="notes"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-accent disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Crear tarea"}
      </button>
    </form>
  );
}
