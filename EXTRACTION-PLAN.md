# Extraction Plan: Notifications Module

## 1. Which Module Would I Extract First?

I would extract the **Notifications module** first.

The Notifications module is responsible for sending messages to users. It has a separate responsibility from Orders, Inventory, and Payments. It can be extracted into a separate service without changing the main business logic too much.

## 2. Five Steps of Extraction

### Step 1: Identify the Module Boundary

I would keep all notification-related logic inside the Notifications module. Other modules would communicate with it through its public API or events instead of importing its internal files.

### Step 2: Separate Data Ownership

I would make the Notifications module responsible for its own messages and notification data. It should not directly access the Orders module's internal data or database tables.

### Step 3: Replace Direct Communication

I would use events to communicate between Orders and Notifications. When an order is successfully placed, Orders would publish an `order.placed` event, and Notifications would handle it.

### Step 4: Extract and Deploy the Service

I would move the Notifications module into a separate application with its own configuration and deployment. I would replace the in-process event communication with reliable communication between services.

### Step 5: Test and Complete the Migration

I would test successful orders, failed orders, notification delivery, retries, and duplicate events. I would also make sure that a notification failure does not cause a successful order to fail. After confirming everything works, I would remove the old notification implementation.

## 3. Risks and Considerations

- Notifications may be delayed if the service is unavailable.
- Events should be stored reliably and retried when delivery fails.
- Duplicate events should not send duplicate notifications.
- The new service will require separate monitoring and deployment.

## Conclusion

I would extract Notifications first because it has a clear responsibility and can operate independently. However, I would keep it inside the modular monolith until there is a real need for independent deployment or scaling.