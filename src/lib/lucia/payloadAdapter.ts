import { getPayloadHMR } from '@payloadcms/next/utilities'
import type { Adapter, DatabaseSession, DatabaseUser, UserId } from 'lucia'
import { Payload } from 'payload'
import config from '@/payload.config'
import { getCachedPayload } from '@/plugins/cached-local-api'
import type { CachedPayload } from '@payload-enchants/cached-local-api'
import { COLLECTION_SLUG } from '@/config'
import { Session, User } from '@/payload-types'

export class PayloadAdapter implements Adapter {
  private payload: Payload | null = null
  private cachedPayload: CachedPayload | null = null
  private initialized: boolean = false

  private constructor() {}

  private async initialize() {
    if (!this.initialized) {
      this.payload = await getPayloadHMR({ config })
      this.cachedPayload = getCachedPayload(this.payload)
      this.initialized = true
    }
  }

  public static create(): PayloadAdapter {
    const adapter = new PayloadAdapter()

    return new Proxy(adapter, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver)
        if (typeof value === 'function') {
          return async (...args: any[]) => {
            await target.initialize()
            return (value as Function).apply(target, args)
          }
        }
        return value
      },
    })
  }
  // private payload: Payload
  // private cachedPayload: CachedPayload

  // constructor(payload: Payload, cachedPayload: CachedPayload) {
  //   this.payload = payload
  //   this.cachedPayload = cachedPayload
  // }

  // public static async createInstance(): Promise<PayloadAdapter> {
  //   const payload = await getPayloadHMR({ config })
  //   const cachedPayload = getCachedPayload(payload)

  //   return new PayloadAdapter(payload, cachedPayload)
  // }

  // public static async initialize(): Promise<PayloadAdapter> {
  //   return await PayloadAdapter.createInstance()
  // }

  public async deleteSession(sessionId: string): Promise<void> {
    await this.payload!.delete({
      collection: COLLECTION_SLUG.SESSION,
      where: {
        id: {
          equals: sessionId,
        },
      },
    })
  }

  public async deleteUserSessions(userId: UserId): Promise<void> {
    await this.payload!.delete({
      collection: COLLECTION_SLUG.SESSION,
      where: {
        userId: {
          equals: userId,
        },
      },
    })
  }

  public async getSessionAndUser(
    sessionId: string,
  ): Promise<[session: DatabaseSession | null, user: DatabaseUser | null]> {
    const result = await this.cachedPayload!.findOne({
      collection: COLLECTION_SLUG.SESSION,
      value: sessionId,
      depth: 1,
    })

    if (!result || typeof result.user !== 'object') return [null, null]

    return [transformIntoDatabaseSession(result), transformIntoDatabaseUser(result.user)]
  }

  public async getUserSessions(userId: string): Promise<DatabaseSession[]> {
    const result = await this.cachedPayload!.find({
      collection: COLLECTION_SLUG.SESSION,
      where: {
        user: {
          equals: userId,
        },
      },
    })

    return result?.docs?.map((session) => {
      return transformIntoDatabaseSession(session)
    })
  }

  public async setSession(session: DatabaseSession): Promise<void> {
    await this.payload!.create({
      collection: COLLECTION_SLUG.SESSION,
      data: {
        id: session.id,
        user: session.userId,
        expiresAt: session.expiresAt.toISOString(),
        ...session.attributes,
      },
    })
  }

  public async updateSessionExpiration(sessionId: string, expiresAt: Date): Promise<void> {
    await this.payload!.update({
      collection: COLLECTION_SLUG.SESSION,
      id: sessionId,
      data: {
        expiresAt: expiresAt.toISOString(),
      },
    })
  }

  /**
   * Todo: test the Where operation
   */
  public async deleteExpiredSessions(): Promise<void> {
    await this.payload!.delete({
      collection: COLLECTION_SLUG.SESSION,
      where: {
        expiresAt: {
          less_than_equal: new Date(),
        },
      },
    })
  }
}

function transformIntoDatabaseSession(raw: Session): DatabaseSession {
  const { id, user, expiresAt, ...attributes } = raw

  return {
    id,
    userId: typeof user === 'object' ? user.id : user,
    expiresAt: new Date(expiresAt),
    attributes,
  }
}

function transformIntoDatabaseUser(raw: User): DatabaseUser {
  const { id, ...attributes } = raw
  return {
    id,
    attributes,
  }
}
